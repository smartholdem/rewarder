# SmartHoldem Delegate Rewarder- Автоматическое вознаграждение избирателей

![rewarder2](https://user-images.githubusercontent.com/9394904/94429798-8fdb3a80-019b-11eb-8de1-b729a77a9d6b.png)

## Установка

Стабильная версия
```
git clone https://github.com/smartholdem/rewarder.git
```

или установить последнюю версию
```
git clone -b v2.0 https://github.com/smartholdem/rewarder.git
```

```
cd rewarder
npm install
```

## Настройки


1. Переименовать sample.config.json > config.json и установить параметры в конфиге

```
mv sample.config.json config.json
nano config.json
```

2. Конфигурация

```js
{
    "node": "127.0.0.1", // SmartHoldem Адрес узла, по умолчанию 127.0.0.1
    "secret": "secret passphrase delegate", // секретная фраза делегата
    "secondSecret": null,
    "port": 3007, // порт приложения
    "percent": 50, // процент выплат вознаграждений избирателям от форжинга
    "day": 15, // период выплат избирателям
    "msg": "reward", // ообщение избирателям
    "daysPending": 3,
    "minVote": 500, // минимальная сумма голоса, которая будет учитываться в выплатах
    "log": "reward.log",
    "globalStatsAPI": "https://rewarder.smartholdem.io", // сервер глобальной статистики, необходим для отображения делегата в https://smartholdem.io/rewarder
    "dev": false
}
```

## Запуск

```
sh restart.sh
```

## Страница делегатов

https://smartholdem.io/rewarder

## Обновление

```
cd rewarder
sh stop.sh
git pull
npm install
sh restart.sh
```

## Public API


# IMPORTANT NOTE

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
