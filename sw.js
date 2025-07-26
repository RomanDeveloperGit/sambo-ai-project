const STORAGE_CHECK_INTERVAL = 30000; // Проверка каждые 30 секунд
const STORAGE_WARNING_THRESHOLD = 1024 * 1024; // 1 МБ

// Функция для форматирования размера в читаемый вид
function formatBytes(bytes) {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция проверки размера localStorage (получает размер от главного потока)
function checkStorageSize(storageSize, isManualCheck = false) {
    try {
        if (storageSize > STORAGE_WARNING_THRESHOLD) {
            self.registration.showNotification('Большой объем данных', {
                body: `Размер данных: ${formatBytes(storageSize)}. Рекомендуется очистить старые записи в главном приложении для освобождения места.`,
                icon: '/judo.png',
                badge: '/judo.png',
                tag: 'storage-warning',
                requireInteraction: true,
                actions: [
                    {
                        action: 'open-app',
                        title: 'Открыть приложение'
                    },
                    {
                        action: 'dismiss',
                        title: 'Закрыть'
                    }
                ],
                data: {
                    currentSize: storageSize
                }
            });
        } else if (isManualCheck) {
            // Показываем положительное уведомление только при ручной проверке
            self.registration.showNotification('Память в норме', {
                body: `Размер данных: ${formatBytes(storageSize)}. Всё в порядке!`,
                icon: '/judo.png',
                badge: '/judo.png',
                tag: 'storage-ok',
                requireInteraction: false,
                actions: [
                    {
                        action: 'dismiss',
                        title: 'Закрыть'
                    }
                ],
                data: {
                    currentSize: storageSize
                }
            });
        }
    } catch (error) {
        console.error('Ошибка проверки localStorage:', error);
    }
}

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker установлен');
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker активирован');
    event.waitUntil(self.clients.claim());
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open-app') {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                // Если приложение уже открыто, фокусируемся на нем
                if (clients.length > 0) {
                    return clients[0].focus();
                }
                // Иначе открываем новое окно
                return self.clients.openWindow('/');
            })
        );
    }
});

// Обработка сообщений от главного потока
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CHECK_STORAGE') {
        // Получаем размер и флаг ручной проверки от главного потока
        checkStorageSize(event.data.storageSize, event.data.isManualCheck);
    }
});