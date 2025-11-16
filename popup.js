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

// --- Account management: save / list / use / delete ---
function loadAccounts() {
    chrome.storage.local.get(['accounts'], (result) => {
        const accounts = result.accounts || [];
        renderAccounts(accounts);
    });
}

function renderAccounts(accounts) {
    const list = document.getElementById('accounts-list');
    const empty = document.getElementById('accounts-empty');
    list.innerHTML = '';
    if (!accounts || accounts.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    accounts.forEach((acct) => {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = acct.name || '(no name)';
        nameSpan.style.color = '#fff';
        nameSpan.style.display = 'inline-block';
        nameSpan.style.width = '120px';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis';

        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.style.marginLeft = '6px';
        loginBtn.addEventListener('click', () => {
            loginWithToken(acct.token);
        });

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.marginLeft = '6px';
        editBtn.addEventListener('click', () => {
            const newName = prompt('Enter a new name for this account:', acct.name || '');
            if (newName !== null) {
                chrome.storage.local.get(['accounts'], (result) => {
                    const updated = (result.accounts || []).map(a => a.id === acct.id ? { ...a, name: newName } : a);
                    chrome.storage.local.set({ accounts: updated }, () => {
                        loadAccounts();
                        showNotification('Account name updated', 'success');
                    });
                });
            }
        });

        const autoCheckbox = document.createElement('input');
        autoCheckbox.type = 'checkbox';
        autoCheckbox.checked = !!acct.autoLogin;
        autoCheckbox.title = 'Auto-login this account when a Discord tab is available';
        autoCheckbox.style.marginLeft = '8px';
        autoCheckbox.addEventListener('change', () => {
            chrome.storage.local.get(['accounts'], (result) => {
                const updated = (result.accounts || []).map(a => a.id === acct.id ? { ...a, autoLogin: autoCheckbox.checked } : a);
                chrome.storage.local.set({ accounts: updated }, () => {
                    showNotification('Auto-login setting updated', 'success');
                });
            });
        });

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.marginLeft = '6px';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(acct.token).then(() => {
                showNotification('Token Copied To Clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed To Copy Token!', 'error');
            });
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginLeft = '6px';
        delBtn.addEventListener('click', () => {
            chrome.storage.local.get(['accounts'], (result) => {
                const updated = (result.accounts || []).filter(a => a.id !== acct.id);
                chrome.storage.local.set({ accounts: updated }, () => {
                    loadAccounts();
                    showNotification('Account Deleted', 'success');
                });
            });
        });

        li.appendChild(nameSpan);
        li.appendChild(loginBtn);
        li.appendChild(editBtn);
        li.appendChild(copyBtn);
        li.appendChild(delBtn);
        li.appendChild(autoCheckbox);

        list.appendChild(li);
    });
}

document.getElementById('save-account-btn').addEventListener('click', () => {
    const token = document.getElementById('login-token').value;
    const name = document.getElementById('account-name').value || '';
    if (!token) {
        showNotification('Please enter a token to save!', 'error');
        return;
    }
    chrome.storage.local.get(['accounts'], (result) => {
        const accounts = result.accounts || [];
        const newAccount = { id: Date.now(), name: name, token: token, autoLogin: false };
        accounts.push(newAccount);
        chrome.storage.local.set({ accounts: accounts }, () => {
            loadAccounts();
            showNotification('Account Saved', 'success');
        });
    });
});

async function loginWithToken(token) {
    if (!token) {
        showNotification('Token is empty', 'error');
        return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('discord.com')) {
        showNotification('This Script Only Works On discord.com', 'error');
        return;
    }
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
                try { localStorage.setItem('token', JSON.stringify(token)); location.reload(); } catch {}
            }
        },
        args: [token],
    }, () => {
        showNotification('Logged In With Token!', 'success');
    });
}

// initialize accounts list on popup open
loadAccounts();

// After loading accounts, attempt auto-login for the first account with autoLogin=true
function tryAutoLogin() {
    chrome.storage.local.get(['accounts'], (result) => {
        const accounts = result.accounts || [];
        const auto = accounts.find(a => a.autoLogin);
        if (!auto) return;
        // find an open discord tab
        chrome.tabs.query({}, (tabs) => {
            const discordTab = tabs.find(t => t.url && t.url.includes('discord.com'));
            if (discordTab) {
                loginWithToken(auto.token);
            }
        });
    });
}

tryAutoLogin();

// Delete Discord cookies and clear localStorage token on discord tabs
document.getElementById('delete-cookies-btn').addEventListener('click', () => {
    // get all cookies for discord domains
    chrome.cookies.getAll({ domain: 'discord.com' }, (cookies) => {
        if (!cookies || cookies.length === 0) {
            showNotification('No Discord cookies found', 'error');
            return;
        }
        let removed = 0;
        cookies.forEach(cookie => {
            const domain = cookie.domain.charAt(0) === '.' ? cookie.domain.substring(1) : cookie.domain;
            const protocol = cookie.secure ? 'https://' : 'http://';
            const url = protocol + domain + cookie.path;
            chrome.cookies.remove({ url: url, name: cookie.name }, () => {
                removed++;
                if (removed === cookies.length) {
                    // also clear localStorage token on any open discord tabs
                    chrome.tabs.query({}, (tabs) => {
                        const discordTabs = tabs.filter(t => t.url && t.url.includes('discord.com'));
                        discordTabs.forEach(t => {
                            chrome.scripting.executeScript({
                                target: { tabId: t.id },
                                func: () => {
                                    try { localStorage.removeItem('token'); } catch(e){}
                                    try { sessionStorage.clear(); } catch(e){}
                                    try { location.reload(); } catch(e){}
                                }
                            });
                        });
                    });
                    showNotification('Discord cookies removed', 'success');
                }
            });
        });
    });
});

document.getElementById('get-token-tab').addEventListener('click', () => {
    document.getElementById('get-token-content').classList.add('active');
    document.getElementById('login-content').classList.remove('active');
    const accountsContent = document.getElementById('accounts-content');
    if (accountsContent) accountsContent.classList.remove('active');
    document.getElementById('get-token-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    const accountsTab = document.getElementById('accounts-tab'); if (accountsTab) accountsTab.classList.remove('active');
});

document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-content').classList.add('active');
    document.getElementById('get-token-content').classList.remove('active');
    const accountsContent = document.getElementById('accounts-content');
    if (accountsContent) accountsContent.classList.remove('active');
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('get-token-tab').classList.remove('active');
    const accountsTab = document.getElementById('accounts-tab'); if (accountsTab) accountsTab.classList.remove('active');
});

document.getElementById('accounts-tab').addEventListener('click', () => {
    document.getElementById('accounts-content').classList.add('active');
    document.getElementById('login-content').classList.remove('active');
    document.getElementById('get-token-content').classList.remove('active');
    document.getElementById('accounts-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('get-token-tab').classList.remove('active');
});
