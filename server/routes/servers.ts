import { Router } from 'express';
import { ServerController } from '../controllers/serverController';
import DatabaseManager from '../services/databaseManager';

export function createServerRouter(db: DatabaseManager) {
    const router = Router();
    const controller = new ServerController(db);

    router.get('/', controller.getAllServers);
    router.get('/:id', controller.getServerById);
    router.post('/', controller.addServer);
    router.put('/:id', controller.updateServer);
    router.delete('/:id', controller.deleteServer);

    return router;
}
