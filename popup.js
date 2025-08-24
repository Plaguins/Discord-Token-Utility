function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('show', 'error', 'success');
    notification.classList.add('show', type);
  
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
}

document.getElementById('get-token-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes("discord.com")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                try {
                    let token = null;
                    
                    if (window.webpackChunkdiscord_app) {
                        window.webpackChunkdiscord_app.push([
                            [Math.random()],
                            {},
                            (req) => {
                                if (!req.c) return;
                                for (const m of Object.values(req.c)) {
                                    try {
                                        if (!m.exports || m.exports === window) continue;
                                        
                                        if (m.exports.getToken) {
                                            token = m.exports.getToken();
                                            if (token) return token;
                                        }
                                        
                                        for (const ex of Object.values(m.exports)) {
                                            if (ex && typeof ex === 'object' && ex.getToken) {
                                                token = ex.getToken();
                                                if (token) return token;
                                            }
                                        }
                                    } catch (e) {
                                    }
                                }
                            }
                        ]);
                        window.webpackChunkdiscord_app.pop();
                    }
                    
                    if (!token && window.webpackChunkdiscord_app) {
                        const modules = window.webpackChunkdiscord_app.push([[Symbol()], {}, req => req]);
                        window.webpackChunkdiscord_app.pop();
                        
                        for (const moduleId of Object.keys(modules.c || {})) {
                            try {
                                const module = modules(moduleId);
                                if (module?.getToken) {
                                    token = module.getToken();
                                    if (token) break;
                                }
                                if (module?.default?.getToken) {
                                    token = module.default.getToken();
                                    if (token) break;
                                }
                            } catch (e) {
                            }
                        }
                    }
                    
                    if (!token) {
                        try {
                            const stored = localStorage.getItem('token');
                            if (stored) {
                                token = JSON.parse(stored);
                            }
                        } catch (e) {
                        }
                    }
                    
                    if (!token) {
                        try {
                            const scripts = document.querySelectorAll('script');
                            for (const script of scripts) {
                                if (script.textContent && script.textContent.includes('getToken')) {
                                    const match = script.textContent.match(/getToken[^"']*["']([^"']+)["']/);
                                    if (match) {
                                        token = match[1];
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                        }
                    }
                    
                    return token;
                } catch (error) {
                    console.error('Error extracting token:', error);
                    return null;
                }
            },
        }, (result) => {
            if (result && result[0] && result[0].result) {
                document.getElementById('token').value = result[0].result;
                showNotification("Token Retrieved Successfully!", "success");
                document.getElementById('copy-btn').disabled = false;
            } else {
                document.getElementById('token').value = 'Token not found';
                showNotification("Failed To Retrieve Token! Make sure you're logged into Discord.", "error");
            }
        });
    } else {
        document.getElementById('token').value = "This Script Only Works On discord.com";
        showNotification("This Script Only Works On discord.com", "error");
    }
});

document.getElementById('copy-btn').addEventListener('click', () => {
    const token = document.getElementById('token').value;
    if (token && token !== 'Token not found' && token !== 'This Script Only Works On discord.com') {
        navigator.clipboard.writeText(token).then(() => {
            showNotification("Token Copied To Clipboard!", "success");
        }).catch(err => {
            showNotification("Failed To Copy Token!", "error");
            console.error("Error copying token : ", err);
        });
    } else {
        showNotification("No Token To Copy!", "error");
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const token = document.getElementById('login-token').value;
    if (token) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url.includes("discord.com")) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (token) => {
                    try {
                        window.webpackChunkdiscord_app.push([
                            [Symbol()],
                            {},
                            req => {
                                if (!req.c) return;
                                for (let m of Object.values(req.c)) {
                                    try {
                                        if (!m.exports || m.exports === window) continue;
                                        if (m.exports?.setToken) {
                                            m.exports.setToken(token);
                                            return;
                                        }
                                        for (let ex in m.exports) {
                                            if (m.exports?.[ex]?.setToken) {
                                                m.exports[ex].setToken(token);
                                                return;
                                            }
                                        }
                                    } catch {}
                                }
                            },
                        ]);
                        window.webpackChunkdiscord_app.pop();
                        localStorage.setItem('token', JSON.stringify(token));
                        location.reload();
                    } catch (error) {
                        console.error('Error setting token :', error);
                        localStorage.setItem('token', JSON.stringify(token));
                        location.reload();
                    }
                },
                args: [token],
            }, () => {
                showNotification("Logged In With Token!", "success");
            });
        } else {
            showNotification("This Script Only Works On discord.com", "error");
        }
    } else {
        showNotification("Please Enter A Token!", "error");
    }
});

document.getElementById('get-token-tab').addEventListener('click', () => {
    document.getElementById('get-token-content').classList.add('active');
    document.getElementById('login-content').classList.remove('active');
    document.getElementById('get-token-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
});

document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-content').classList.add('active');
    document.getElementById('get-token-content').classList.remove('active');
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('get-token-tab').classList.remove('active');
});
