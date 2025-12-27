// --- src/theme/utils.js ---

function buildCssVariables(theme) {
    const variables = {};

    // DÜZELTME: 'breakpoints' ve 'zIndex' kategorilerini de dahil et
    ['typography', 'spacing', 'shape', 'elevation', 'motion', 'breakpoints', 'zIndex'].forEach(category => {
        if (theme[category]) {
            if (category === 'motion') {
                for (const type in theme.motion) {
                    if (type === 'transition' || type === 'easing') {
                        for (const key in theme.motion[type]) {
                            variables[`--motion-${key}`] = theme.motion[type][key];
                        }
                    }
                }
            } else {
                 for (const key in theme[category]) {
                    if(typeof theme[category][key] === 'object') {
                        for (const prop in theme[category][key]) {
                            variables[`--${category}-${key}-${prop}`] = theme[category][key][prop];
                        }
                    } else {
                        // DÜZELTME: Kategori ismini tire ile ekle (örn: --breakpoint-sm)
                        variables[`--${category}-${key.replace(category + '-', '')}`] = theme[category][key];
                    }
                }
            }
        }
    });

    return variables;
}

export function applyThemeToDocument(theme) {
  if (!theme) return;

  const variables = buildCssVariables(theme);
  const root = document.body;

  for (const key in variables) {
    root.style.setProperty(key, variables[key]);
  }
}