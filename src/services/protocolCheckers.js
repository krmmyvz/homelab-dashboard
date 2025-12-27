/**
 * Multi-Protocol Service Checkers
 * Supports HTTP, HTTPS, TCP, SSH, MySQL, Redis, Docker and custom protocols
 */

import net from 'net';

class ProtocolCheckers {
  constructor() {
    this.checkers = {
      http: this.checkHTTP.bind(this),
      https: this.checkHTTPS.bind(this),
      tcp: this.checkTCP.bind(this),
      ssh: this.checkSSH.bind(this),
      mysql: this.checkMySQL.bind(this),
      redis: this.checkRedis.bind(this),
      docker: this.checkDocker.bind(this),
      ping: this.checkPing.bind(this),
      custom: this.checkCustom.bind(this)
    };
  }

  /**
   * Main protocol checker dispatcher
   */
  async checkService(service, timeout = 5000) {
  const { protocol = 'http' } = service;
    
    try {
      const startTime = Date.now();
      const checker = this.checkers[protocol.toLowerCase()];
      
      if (!checker) {
        throw new Error(`Unsupported protocol: ${protocol}`);
      }

      const result = await Promise.race([
        checker(service),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;

      return {
        status: result ? 'online' : 'offline',
        responseTime,
        protocol,
        timestamp: new Date().toISOString(),
        error: null
      };

    } catch (error) {
      return {
        status: 'offline',
        responseTime: timeout,
        protocol,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * HTTP/HTTPS checker with enhanced features
   */
  async checkHTTP(service) {
  const { url, expectedStatus = [200, 301, 302], expectedContent } = service;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Homelab-Dashboard-Monitor/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    // Check status code
    if (!expectedStatus.includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    // Check content if specified
    if (expectedContent) {
      const text = await response.text();
      if (!text.includes(expectedContent)) {
        throw new Error('Expected content not found');
      }
    }

    return true;
  }

  /**
   * HTTPS checker with SSL certificate validation
   */
  async checkHTTPS(service) {
    return this.checkHTTP(service);
  }

  /**
   * TCP port checker
   */
  async checkTCP(service) {
    const { host, port } = this.parseHostPort(service.url || service.host, service.port);
    
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.connect(port, host);
    });
  }

  /**
   * SSH service checker
   */
  async checkSSH(service) {
    const { host, port = 22 } = this.parseHostPort(service.url || service.host, service.port);
    return this.checkTCP({ host, port });
  }

  /**
   * MySQL database checker
   */
  async checkMySQL(service) {
    const { host, port = 3306 } = this.parseHostPort(service.url || service.host, service.port);
    return this.checkTCP({ host, port });
  }

  /**
   * Redis checker
   */
  async checkRedis(service) {
    const { host, port = 6379 } = this.parseHostPort(service.url || service.host, service.port);
    return this.checkTCP({ host, port });
  }

  /**
   * Docker container checker (via Docker API)
   */
  async checkDocker(service) {
    const { containerName, dockerHost = 'localhost:2376' } = service;
    
    try {
      const res = await fetch(`http://${dockerHost}/containers/${containerName}/json`);
      const container = await res.json();
      return container.State?.Status === 'running';
    } catch {
      return this.checkTCP(service);
    }
  }

  /**
   * ICMP ping checker (fallback to TCP)
   */
  async checkPing(service) {
    // In browser environment, fallback to TCP/HTTP
    return this.checkTCP(service);
  }

  /**
   * Custom protocol checker
   */
  async checkCustom(service) {
    const { customCheck } = service;
    
    if (typeof customCheck === 'function') {
      return await customCheck(service);
    }
    
    // Default to HTTP check
    return this.checkHTTP(service);
  }

  /**
   * Parse host and port from URL or separate values
   */
  parseHostPort(urlOrHost, defaultPort) {
    try {
      if (urlOrHost?.startsWith('http')) {
        const url = new URL(urlOrHost);
        return {
          host: url.hostname,
          port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80)
        };
      }
      
      if (urlOrHost?.includes(':')) {
        const [host, port] = urlOrHost.split(':');
        return { host, port: parseInt(port) };
      }
      
      return {
        host: urlOrHost || 'localhost',
        port: defaultPort || 80
      };
  } catch {
      return {
        host: 'localhost',
        port: defaultPort || 80
      };
    }
  }

  /**
   * Get SSL certificate information
   */
  async getSSLInfo(url) {
    try {
      await fetch(url);
      // Note: In browser, we can't access certificate details directly
      // This would need to be implemented on the server side
      return {
        valid: true,
        expiresAt: null,
        issuer: null
      };
    } catch {
      return { valid: false, error: 'ssl-info-error' };
    }
  }

  /**
   * Batch check multiple services
   */
  async checkMultipleServices(services, timeout = 5000) {
    const promises = services.map(service => 
      this.checkService(service, timeout).catch(error => ({
        status: 'offline',
        error: error.message,
        service: service.id
      }))
    );

    return Promise.all(promises);
  }
}

export default ProtocolCheckers;
