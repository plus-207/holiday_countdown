const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 文件路径：与 main.js 同目录
const timeFilePath = path.join(__dirname, 'time.txt');

// 读取 time.txt 中的时间戳
function readTimestamp() {
    try {
        if (fs.existsSync(timeFilePath)) {
            const content = fs.readFileSync(timeFilePath, 'utf-8').trim();
            if (content !== '') {
                const ts = parseInt(content, 10);
                if (!isNaN(ts) && ts > 0) {
                    return ts;
                }
            }
        }
    } catch (err) {
        console.error('读取 time.txt 失败:', err);
    }
    return null; // 文件不存在或内容无效
}

// 写入时间戳到 time.txt
function writeTimestamp(ts) {
    try {
        fs.writeFileSync(timeFilePath, String(ts), 'utf-8');
        return true;
    } catch (err) {
        console.error('写入 time.txt 失败:', err);
        return false;
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 960,
        minHeight: 540,
        fullscreenable: true,
        resizable: true,
        frame: true,
        backgroundColor: '#060b14',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,   // 开启上下文隔离，保证安全
            nodeIntegration: false,   // 不直接暴露 Node API 给渲染进程
        },
        icon: undefined, // 可添加图标路径
    });

    mainWindow.loadFile('index.html');

    // 窗口准备好后再显示，避免白屏
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // 可选：最大化或全屏
        // mainWindow.maximize();
    });

    // 开发时可以打开 DevTools
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        // 清理
    });
}

// IPC 处理：获取放假时间戳
ipcMain.handle('get-timestamp', async () => {
    return readTimestamp();
});

// IPC 处理：设置并保存时间戳
ipcMain.handle('set-timestamp', async (event, ts) => {
    const success = writeTimestamp(ts);
    return success;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});