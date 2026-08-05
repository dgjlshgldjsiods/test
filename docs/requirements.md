# Задача: прототип ITSM-системы на HTML, CSS и JavaScript

Нужно разработать frontend-прототип части ITSM-системы.

Проект должен работать без сборщика, без npm и без frontend-фреймворков. Необходимо использовать отдельные HTML-страницы, обычный JavaScript ES6+ и CSS.

Frontend должен обращаться к реальному REST API сервера Naumen Service Desk.

Также необходимо подготовить примеры серверных Groovy-функций в стиле Naumen Service Desk.

В будущем backend на базе Naumen Service Desk будет заменён самописным сервером. Поэтому frontend не должен напрямую зависеть от внутренних объектов, классов и API Naumen.

Все особенности вызова Naumen должны быть изолированы внутри единого транспортного клиента `NaumenApiClient`.

В дальнейшем замена Naumen на другой backend должна потребовать изменения транспортного слоя и, при необходимости, предметных API-модулей, но не контроллеров страниц и UI-компонентов.

---

# 1. Главные ограничения

1. Не использовать:

   * React;
   * Vue;
   * Angular;
   * TypeScript;
   * Node.js;
   * npm;
   * Vite;
   * Webpack;
   * Babel;
   * другие сборщики и frontend-фреймворки.

2. Использовать:

   * HTML;
   * CSS;
   * обычный JavaScript ES6+;
   * браузерные ES-модули;
   * Bootstrap;
   * SurveyJS Form Library;
   * SurveyJS Creator.

3. Все страницы должны быть отдельными HTML-файлами.

4. Общий код нельзя копировать между страницами.

5. Общая логика должна быть вынесена в переиспользуемые JavaScript-модули.

6. Общие стили должны быть вынесены в отдельный каталог CSS.

7. Все обращения к серверу должны проходить через единый класс `NaumenApiClient`.

8. Запрещается использовать `fetch` непосредственно:

   * в HTML-файлах;
   * в контроллерах страниц;
   * в UI-компонентах;
   * в предметных API-модулях;
   * в бизнес-логике.

9. Единственное место, где разрешён прямой вызов `fetch`:

```text
js/api/naumen-api-client.js
```

10. Frontend не должен напрямую обращаться к PostgreSQL.

11. Frontend не должен выполнять SQL-запросы.

12. Не создавать:

* SQL-схему;
* миграции;
* отдельную базу данных;
* backend на Node.js.

13. Серверные Groovy-функции должны работать через серверные API и хранилище Naumen.

14. Конкретную модель хранения объектов Naumen необходимо изолировать в сервисном слое.

15. Интерфейс должен быть адаптивным.

16. Интерфейс должен поддерживать светлую и тёмную темы.

17. Интерфейс должен поддерживать русский и английский языки.

18. На первом этапе достаточно реализовать словари для русского и английского языков.

19. Язык интерфейса выбирается администратором.

20. Можно использовать минимальные демонстрационные данные только для разработки отдельных UI-компонентов.

21. Демонстрационные данные не должны подменять реальный REST API.

22. Не использовать mock-сервер вместо реального REST API.

23. При недоступности REST API интерфейс должен показывать понятную ошибку.

24. Запрещено автоматически переключаться на фиктивные данные при ошибке сервера.

25. Проект не обязан работать через протокол:

```text
file://
```

26. Проект должен запускаться через любой статический HTTP-сервер.

27. Допустимые способы запуска:

* `python -m http.server`;
* встроенный HTTP-сервер IDE;
* nginx;
* Apache;
* публикация статических файлов в Naumen.

28. Использовать браузерные ES-модули:

```html
<script type="module" src="js/pages/login-page.js"></script>
```

29. Проект не должен требовать этапа сборки перед запуском.

---

# 2. Предварительный этап

До начала реализации необходимо:

1. Изучить все требования.

2. Найти неоднозначности.

3. Перечислить принятые предположения.

4. Подготовить архитектуру проекта.

5. Подготовить итоговое дерево файлов.

6. Подготовить модели данных.

7. Подготовить REST-контракты.

8. Подготовить список серверных Groovy-функций.

9. Подготовить модель ролей и прав.

10. Подготовить жизненный цикл форм и их версий.

11. Подготовить алгоритм определения SLA.

12. Подготовить архитектуру авторизации.

13. Подготовить архитектуру пользовательских сессий.

14. Подготовить план реализации по небольшим вертикальным частям.

15. Определить места, где конкретные внутренние API Naumen неизвестны.

16. Не выдумывать несуществующие методы Naumen как реально доступные.

17. В неизвестных местах использовать проектные адаптеры и комментарии `TODO`.

Архитектурное описание сохранить в:

```text
docs/architecture.md
```

Описание REST API сохранить в:

```text
docs/rest-api.md
```

Описание ролей и прав сохранить в:

```text
docs/permissions.md
```

После проектирования приступить к реализации.

---

# 3. Рекомендуемая структура проекта

Использовать примерно следующую структуру:

```text
/
├── login.html
├── service-catalog.html
├── service-form.html
├── requests.html
├── request-card.html
├── profile.html
│
├── admin/
│   ├── catalog-editor.html
│   ├── forms.html
│   ├── form-editor.html
│   └── sla-editor.html
│
├── css/
│   ├── bootstrap.min.css
│   ├── app.css
│   ├── themes.css
│   ├── components.css
│   └── pages/
│       ├── login.css
│       ├── catalog.css
│       ├── forms.css
│       ├── requests.css
│       ├── profile.css
│       └── sla.css
│
├── js/
│   ├── config.js
│   ├── app.js
│   ├── auth.js
│   │
│   ├── api/
│   │   ├── naumen-api-client.js
│   │   ├── auth-api.js
│   │   ├── catalog-api.js
│   │   ├── forms-api.js
│   │   ├── requests-api.js
│   │   ├── sla-api.js
│   │   ├── users-api.js
│   │   ├── files-api.js
│   │   └── dictionaries-api.js
│   │
│   ├── core/
│   │   ├── auth-session.js
│   │   ├── permissions.js
│   │   ├── i18n.js
│   │   ├── theme.js
│   │   ├── validation.js
│   │   ├── formatters.js
│   │   ├── query-params.js
│   │   ├── request-id.js
│   │   ├── sla-matcher.js
│   │   ├── availability-matcher.js
│   │   ├── form-versioning.js
│   │   └── event-bus.js
│   │
│   ├── i18n/
│   │   ├── ru.js
│   │   └── en.js
│   │
│   ├── components/
│   │   ├── app-layout.js
│   │   ├── navbar.js
│   │   ├── sidebar.js
│   │   ├── modal.js
│   │   ├── confirm-modal.js
│   │   ├── notifications.js
│   │   ├── data-table.js
│   │   ├── pagination.js
│   │   ├── loading-indicator.js
│   │   ├── error-panel.js
│   │   ├── empty-state.js
│   │   ├── forbidden-state.js
│   │   ├── user-selector.js
│   │   ├── group-selector.js
│   │   ├── organization-selector.js
│   │   ├── department-selector.js
│   │   ├── dictionary-selector.js
│   │   ├── file-uploader.js
│   │   └── sla-indicator.js
│   │
│   └── pages/
│       ├── login-page.js
│       ├── catalog-editor-page.js
│       ├── service-catalog-page.js
│       ├── service-form-page.js
│       ├── forms-page.js
│       ├── form-editor-page.js
│       ├── requests-page.js
│       ├── request-card-page.js
│       ├── sla-editor-page.js
│       └── profile-page.js
│
├── vendor/
│   ├── bootstrap/
│   ├── surveyjs/
│   └── qunit/
│
├── groovy/
│   ├── AuthFunctions.groovy
│   ├── CatalogFunctions.groovy
│   ├── FormFunctions.groovy
│   ├── RequestFunctions.groovy
│   ├── SlaFunctions.groovy
│   ├── UserFunctions.groovy
│   ├── DictionaryFunctions.groovy
│   ├── FileFunctions.groovy
│   └── CommonFunctions.groovy
│
├── tests/
│   ├── test-runner.html
│   ├── naumen-api-client.test.js
│   ├── permissions.test.js
│   ├── validation.test.js
│   ├── sla-matcher.test.js
│   ├── availability-matcher.test.js
│   ├── form-versioning.test.js
│   ├── i18n.test.js
│   └── auth-session.test.js
│
├── docs/
│   ├── architecture.md
│   ├── rest-api.md
│   ├── permissions.md
│   ├── running.md
│   ├── security.md
│   └── naumen-integration.md
│
└── README.md
```

Структуру разрешается улучшать, но необходимо сохранить разделение между:

* транспортным REST-клиентом;
* предметными API-модулями;
* бизнес-логикой;
* UI-компонентами;
* контроллерами страниц;
* локализацией;
* авторизацией;
* проверкой прав;
* Groovy-функциями;
* тестами.

---

# 4. Страницы системы

Необходимо реализовать 10 отдельных HTML-страниц.

---

## 4.1. Редактор каталога услуг

Файл:

```text
admin/catalog-editor.html
```

Страница доступна ролям:

```text
CATALOG_ADMIN
SYSTEM_ADMIN
```

Каталог имеет древовидную структуру:

```text
Папка
├── Подпапка
│   ├── Услуга
│   └── Услуга
└── Услуга
```

Требования:

1. Создание папки.

2. Создание подпапки.

3. Редактирование папки.

4. Удаление пустой папки.

5. Запрет удаления папки, если в ней находятся:

   * подпапки;
   * услуги.

6. Создание услуги.

7. Редактирование услуги.

8. Перемещение услуги в другую папку.

9. Перемещение выполняется через отдельное действие и выбор целевой папки.

10. Drag-and-drop не обязателен.

11. Одна услуга может находиться только в одной папке.

12. Настройка порядка отображения папок и услуг.

13. Публикация услуги через изменение статуса.

14. Поддержка черновиков.

15. Поддержка архивации.

16. Выбор формы.

17. Выбор опубликованной версии формы.

18. Настройка рабочей группы по умолчанию.

19. Настройка персонального ответственного по умолчанию.

20. Настройка SLA-политики.

21. Настройка доступности услуги:

* всем пользователям;
* конкретным пользователям;
* подразделениям;
* организациям;
* нескольким организациям одновременно.

22. Отображение статуса услуги.

23. Предупреждение при попытке покинуть страницу с несохранёнными изменениями.

24. Поддержка optimistic locking через поле `version` или `updatedAt`.

25. При конфликте изменений показывать понятное сообщение.

Поля услуги:

```text
id
code
title
description
shortDescription
icon
folderId
formId
formVersionId
status
sortOrder
responsibleGroupId
defaultAssigneeId
slaPolicyId
availability
version
createdAt
createdBy
updatedAt
updatedBy
```

Статусы услуги:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Структура `availability`:

```javascript
{
    mode: "ALL" | "RESTRICTED",
    userIds: [],
    departmentIds: [],
    organizationIds: []
}
```

Правило доступности:

1. Если `mode` равно `ALL`, услуга доступна всем авторизованным пользователям.

2. Если `mode` равно `RESTRICTED`, услуга доступна, когда выполняется хотя бы одно условие:

   * пользователь явно указан в `userIds`;
   * подразделение пользователя указано в `departmentIds`;
   * хотя бы одна организация пользователя указана в `organizationIds`.

3. Сервер является источником истины при проверке доступности.

4. Frontend может предварительно скрывать недоступные услуги, но сервер обязан повторно проверить доступ при создании заявки.

---

## 4.2. Пользовательский каталог услуг

Файл:

```text
service-catalog.html
```

Страница доступна авторизованным пользователям.

Требования:

1. Показывать только опубликованные услуги.

2. Показывать только услуги, доступные текущему пользователю.

3. Учитывать:

   * персональный доступ;
   * подразделение пользователя;
   * все организации пользователя.

4. Показывать древовидную структуру папок.

5. Поддерживать поиск.

6. Поддерживать хлебные крошки.

7. Поддерживать карточное представление.

8. Поддерживать списочное представление.

9. Сохранять выбранный режим отображения локально.

10. Показывать:

* название;
* краткое описание;
* иконку;
* путь папки.

11. При выборе услуги переходить на:

```text
service-form.html?serviceId=...
```

12. Сервер обязан повторно проверить доступность услуги.

---

## 4.3. Форма создания заявки

Файл:

```text
service-form.html
```

Требования:

1. Получить параметр `serviceId` из URL.

2. Получить данные услуги через REST.

3. Проверить доступ пользователя к услуге.

4. Получить связанную опубликованную версию формы.

5. Отобразить форму через SurveyJS Form Library.

6. Поддержать стандартные типы полей SurveyJS.

7. Поддержать условия видимости.

8. Поддержать условия обязательности.

9. Поддержать простые вычисляемые поля.

10. Не разрешать выполнение произвольного JavaScript из схемы формы.

11. Поддержать справочники, загружаемые через разрешённые REST-функции Naumen.

12. Форма не должна иметь возможность обращаться к произвольным внешним URL.

13. Все динамические справочники должны вызываться через `dictionaries-api.js`.

14. Поддержать загрузку вложений.

15. Показывать название услуги.

16. Показывать описание услуги.

17. Внизу формы разместить кнопку отправки.

18. Перед отправкой выполнить клиентскую валидацию SurveyJS.

19. Сервер обязан повторно выполнить валидацию обязательных и допустимых полей.

20. Добавить защиту от повторной отправки.

21. Во время отправки кнопка должна быть отключена.

22. После успешного создания перейти в карточку заявки:

```text
request-card.html?id=...
```

Заявка должна сохранять ссылку на конкретную версию формы:

```text
formId
formVersionId
```

Snapshot JSON формы на первом этапе сохранять не требуется.

При этом старые версии формы нельзя удалять или изменять.

---

## 4.4. Редактор формы

Файл:

```text
admin/form-editor.html
```

Страница доступна ролям:

```text
FORM_ADMIN
SYSTEM_ADMIN
```

Использовать SurveyJS Creator.

Требования:

1. Создание новой формы.

2. Редактирование существующей формы.

3. Загрузка JSON-схемы формы в SurveyJS Creator.

4. Сохранение черновика.

5. Публикация формы.

6. Автоматическое управление версиями.

7. Версии должны быть целочисленными:

```text
1
2
3
4
```

8. Номер версии назначает сервер.

9. Frontend не должен самостоятельно вычислять следующий номер версии.

10. Опубликованные версии нельзя удалить.

11. Старые версии нельзя удалить.

12. Старые версии нельзя изменить.

13. При открытии опубликованной или старой версии для редактирования создаётся новый черновик.

14. Исходная версия остаётся неизменной.

15. При сохранении изменений сервер создаёт новую версию или обновляет активный черновик в соответствии с принятой моделью.

16. Для одной формы рекомендуется поддерживать только один активный черновик.

17. Если уже существует активный черновик, необходимо:

* открыть его;
* либо показать пользователю предупреждение;
* либо явно предложить продолжить существующий черновик.

18. При публикации новая версия получает статус `PUBLISHED`.

19. Предыдущая опубликованная версия остаётся доступной для старых заявок.

20. Старые заявки продолжают ссылаться на старую версию.

21. Форма должна иметь историю версий.

22. Должна быть возможность открыть любую старую версию в режиме просмотра.

23. Должно быть визуально понятно:

* какая версия опубликована;
* какая версия является черновиком;
* какие версии публиковались раньше;
* из какой версии создан текущий черновик.

24. Поддержать optimistic locking.

25. При конфликте версий вернуть бизнес-ошибку `VERSION_CONFLICT`.

Статусы версии формы:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Модель формы:

```javascript
{
    id,
    code,
    title,
    description,
    currentPublishedVersion,
    activeDraftVersion,
    version,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy
}
```

Модель версии формы:

```javascript
{
    id,
    formId,
    version,
    status,
    schema,
    sourceVersionId,
    entityVersion,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    publishedAt,
    publishedBy
}
```

---

## 4.5. Список форм

Файл:

```text
admin/forms.html
```

Страница доступна ролям:

```text
FORM_ADMIN
SYSTEM_ADMIN
```

Требования:

1. Таблица форм.

2. Поиск по названию.

3. Поиск по коду.

4. Фильтрация по статусу.

5. Отображение опубликованной версии.

6. Отображение наличия активного черновика.

7. Отображение даты последнего изменения.

8. Кнопка создания новой формы.

9. Кнопка редактирования.

10. Кнопка просмотра истории версий.

11. Серверная пагинация.

12. Серверная сортировка.

13. Состояния:

* загрузка;
* пустой список;
* ошибка;
* готово;
* недостаточно прав.

---

## 4.6. Список заявок

Файл:

```text
requests.html
```

Для роли `USER` показывать только заявки, к которым пользователь имеет доступ.

Для `OPERATOR` показывать:

* заявки, назначенные лично пользователю;
* заявки его рабочих групп;
* другие заявки в соответствии с серверными правами.

Для `SYSTEM_ADMIN` разрешить просмотр всех заявок.

Требования:

1. Таблица заявок.

2. Серверная пагинация.

3. Серверная сортировка.

4. Фильтры:

   * номер;
   * название;
   * статус;
   * услуга;
   * автор;
   * заявитель;
   * рабочая группа;
   * ответственный;
   * дата создания;
   * нарушение SLA;
   * срок реакции;
   * срок решения.

5. Поиск.

6. Переход в карточку заявки.

7. Отображение:

   * номера;
   * названия;
   * услуги;
   * автора;
   * статуса;
   * рабочей группы;
   * ответственного;
   * срока реакции;
   * срока решения;
   * состояния SLA;
   * даты создания.

8. Не загружать все заявки сразу.

9. Не выполнять клиентскую пагинацию полного набора заявок.

10. Все фильтры, сортировку и пагинацию передавать в JSON-теле REST-запроса.

---

## 4.7. Карточка заявки

Файл:

```text
request-card.html
```

Требования:

1. Отображение основных полей заявки.

2. Отображение данных услуги.

3. Отображение данных формы, по которой создана заявка.

4. Получение формы по конкретному `formVersionId`.

5. Отображение заполненной формы в режиме просмотра.

6. После создания пользователь не может редактировать поля формы заявки.

7. Изменение статуса.

8. Пока разрешить все переходы статусов.

9. В будущем переходы статусов будут определяться редактором жизненного цикла.

10. Изменение рабочей группы.

11. Изменение персонального ответственного.

12. Ответственный состоит из:

    * рабочей группы;
    * персонального пользователя.

13. Добавление публичного комментария.

14. Добавление внутреннего комментария.

15. Внутренние комментарии доступны только:

    * OPERATOR;
    * SYSTEM_ADMIN;
    * другим ролям, если это будет явно настроено.

16. Отображение вложений.

17. Добавление вложений.

18. История изменений должна включать:

    * создание заявки;
    * изменение статуса;
    * изменение рабочей группы;
    * изменение ответственного;
    * изменение полей;
    * добавление комментария;
    * добавление вложения;
    * расчёт SLA;
    * приостановку SLA;
    * возобновление SLA;
    * конфликты определения SLA.

19. Отображение срока реакции.

20. Отображение срока решения.

21. Отображение оставшегося рабочего времени.

22. Отображение нарушения SLA.

23. Отображение приостановки SLA.

24. Все операции изменения должны проверяться сервером.

25. Frontend не должен считать скрытие кнопки достаточной проверкой права.

26. Поддержать optimistic locking через `expectedVersion`.

Статусы заявок:

```text
NEW
REGISTERED
IN_PROGRESS
WAITING_USER
RESOLVED
CLOSED
CANCELLED
```

---

## 4.8. Настройка SLA

Файл:

```text
admin/sla-editor.html
```

Страница доступна ролям:

```text
SLA_ADMIN
SYSTEM_ADMIN
```

SLA должен определять:

```text
reactionTime
resolutionTime
calendarId
pausedStatuses
```

Время рассчитывается в рабочих часах.

Календарь, праздники, часовой пояс и рабочие интервалы необходимо получать через REST-функции Naumen.

SLA настраивается в виде упорядоченной таблицы правил.

Пример правила:

```text
Важность = 1
Срочность = 2
Система = 1С
VIP = Нет
Срок реакции = 2 рабочих часа
Срок решения = 8 рабочих часов
Календарь = Основной календарь
```

Требования:

1. Добавление SLA-правила.

2. Редактирование SLA-правила.

3. Удаление SLA-правила.

4. Включение и отключение SLA-правила.

5. Изменение порядка правил.

6. Первым применяется первое подходящее включённое правило.

7. Поддержать значение:

```text
ANY
```

8. Поддержать операторы:

   * равно;
   * не равно;
   * входит в список;
   * не входит в список;
   * пусто;
   * не пусто;
   * диапазон.

9. Условие должно поддерживать:

   * поля заявки;
   * свойства пользователя;
   * свойства услуги.

10. Примеры свойств:

* важность;
* срочность;
* система;
* VIP;
* организация;
* подразделение;
* услуга;
* категория;
* автор;
* заявитель.

11. Если подходит несколько правил:

* использовать первое по порядку;
* вернуть список всех совпавших правил;
* записать в историю заявки информацию о конфликте.

12. SLA рассчитывается:

* при создании заявки;
* при каждой смене статуса.

13. Для некоторых статусов SLA может быть приостановлен.

14. Список приостанавливающих статусов хранится в SLA-правиле или политике.

15. При пересчёте SLA должна добавляться запись в историю.

16. Реализовать предварительную проверку правила на тестовых данных.

17. Реализовать проверку потенциально пересекающихся правил.

18. Проверка пересечений может быть приблизительной, но должна явно показывать, что результат является предупреждением, а не строгим математическим доказательством отсутствия пересечений.

19. Сервер является источником истины при определении SLA.

Модель SLA-правила:

```javascript
{
    id,
    title,
    serviceId,
    enabled,
    order,
    conditions: [
        {
            field,
            operator,
            value
        }
    ],
    reactionTimeMinutes,
    resolutionTimeMinutes,
    calendarId,
    pausedStatuses,
    version,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy
}
```

---

## 4.9. Карточка пользователя

Файл:

```text
profile.html
```

Страница текущего пользователя должна отображать:

1. Полные данные пользователя.

2. Логин.

3. ФИО.

4. Электронную почту.

5. Телефон, если доступен.

6. Организации пользователя.

7. Подразделение.

8. Рабочие группы.

9. Роли.

10. Язык интерфейса.

11. Часовой пояс.

12. Созданные пользователем заявки.

13. Персонально назначенные пользователю заявки.

14. Заявки его рабочих групп.

Должны быть отдельные списки:

```text
Мои заявки
Назначено лично мне
Назначено моим группам
```

В списке «Назначено лично мне»:

* пользователь является персональным ответственным;
* рабочая группа заявки может быть любой из рабочих групп пользователя.

В списке «Назначено моим группам»:

* заявка назначена на одну из рабочих групп пользователя;
* персональный ответственный может отсутствовать;
* персональным ответственным может быть другой пользователь.

Администратор должен иметь возможность открыть карточку другого пользователя:

```text
profile.html?id=userId
```

Редактирование профиля другого пользователя доступно роли:

```text
SYSTEM_ADMIN
```

Обычный пользователь может просматривать собственные данные, но не должен иметь возможность изменять защищённые поля ролей и организаций.

---

## 4.10. Страница входа

Файл:

```text
login.html
```

Необходимо разделять:

1. Технический `accessKey` Naumen.

2. Пользовательский `sessionToken` приложения.

Требования страницы входа:

1. Поле логина.

2. Поле пароля.

3. Вызов серверной функции:

```text
modules.newItsmTest.authLogin
```

4. Передача логина и пароля в JSON-теле.

5. Получение пользовательского `sessionToken`.

6. Получение времени окончания сессии `expiresAt`.

7. Получение данных текущего пользователя.

8. Получение ролей пользователя.

9. Сохранение `sessionToken` в `localStorage`.

10. Сохранение минимальных данных пользователя в `localStorage`.

11. Не сохранять пароль.

12. Не сохранять логин и пароль как данные формы после авторизации.

13. Перенаправление после успешного входа.

14. Понятное сообщение при неправильном логине или пароле.

15. Кнопка выхода.

16. При выходе вызвать:

```text
modules.newItsmTest.authLogout
```

17. После выхода удалить локальную пользовательскую сессию.

18. Проверять `expiresAt`.

19. Поддержать серверную проверку текущей сессии через:

```text
modules.newItsmTest.authGetCurrentUser
```

20. Поддержать обновление сессии через:

```text
modules.newItsmTest.authRefresh
```

21. При бизнес-ошибке:

```text
SESSION_EXPIRED
```

очищать локальную сессию и переходить на страницу входа.

22. При бизнес-ошибке:

```text
INVALID_SESSION
```

очищать локальную сессию и переходить на страницу входа.

23. При HTTP 401 также очищать локальную сессию и переходить на страницу входа.

24. Все защищённые страницы должны проверить наличие пользовательской сессии до отображения содержимого.

25. Наличие технического `accessKey` не означает, что пользователь авторизован.

Пример успешного ответа:

```json
{
    "success": true,
    "data": {
        "sessionToken": "generated-user-session-token",
        "expiresAt": "2026-08-06T01:00:00+03:00",
        "user": {
            "id": "employee$123",
            "login": "ivanov",
            "title": "Иванов Иван Иванович",
            "roles": [
                "USER",
                "OPERATOR"
            ]
        }
    },
    "requestId": "request-id"
}
```

Не использовать пользовательский формат:

```json
{
    "accessToken": "...",
    "tokenType": "Bearer"
}
```

Не добавлять пользовательский токен в заголовок:

```http
Authorization: Bearer ...
```

Пользовательский `sessionToken` передаётся в JSON-теле защищённых запросов.

---

# 5. Роли и права

Использовать роли:

```text
USER
OPERATOR
CATALOG_ADMIN
FORM_ADMIN
SLA_ADMIN
SYSTEM_ADMIN
```

Пример прав:

```text
USER
- просмотр доступного каталога;
- создание заявки;
- просмотр собственных заявок;
- просмотр заявок, доступных пользователю;
- добавление публичных комментариев;
- просмотр собственного профиля.

OPERATOR
- просмотр назначенных заявок;
- просмотр заявок своих рабочих групп;
- изменение статуса;
- изменение ответственного;
- изменение рабочей группы;
- добавление публичных комментариев;
- добавление внутренних комментариев;
- работа с вложениями.

CATALOG_ADMIN
- управление каталогом;
- управление папками;
- управление услугами;
- перемещение услуг;
- настройка доступности услуг;
- публикация услуг;
- архивация услуг.

FORM_ADMIN
- просмотр форм;
- создание форм;
- редактирование форм через новые версии;
- создание новых версий;
- сохранение черновиков;
- публикация версий;
- просмотр истории версий.

SLA_ADMIN
- управление SLA;
- добавление правил;
- изменение правил;
- удаление правил;
- изменение порядка правил;
- проверка конфликтов;
- тестирование правил.

SYSTEM_ADMIN
- полный доступ;
- управление пользователями;
- редактирование профилей;
- изменение языка системы;
- изменение системных настроек;
- доступ ко всем административным страницам.
```

Frontend должен:

1. Скрывать недоступные пункты меню.

2. Скрывать недоступные кнопки.

3. Не открывать административные страницы пользователям без нужной роли.

4. Показывать состояние `forbidden`, если доступ запрещён.

При этом сервер обязан повторно проверять:

* пользовательскую сессию;
* роли;
* права на действие;
* права на конкретный объект.

---

# 6. Интеграция с REST API Naumen Service Desk

Frontend должен обращаться к серверным функциям Naumen Service Desk через endpoint:

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=<serverFunction>&params=requestContent,user
```

Пример вызова авторизации:

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.authLogin&params=requestContent,user
```

Где:

* `<baseURL>` — адрес Naumen Service Desk;
* `<accessKey>` — технический ключ доступа к REST API Naumen;
* `func` — полное имя серверной Groovy-функции;
* `params=requestContent,user` — список параметров, передаваемых Naumen в функцию;
* `requestContent` — JSON-объект из тела запроса;
* `user` — пользовательский контекст Naumen, если он доступен.

Все бизнес-параметры необходимо передавать только в JSON-теле POST-запроса.

Запрещено передавать бизнес-параметры в query string.

В query string разрешены только технические параметры Naumen:

```text
accessKey
func
params
```

Для всех бизнес-операций использовать только:

```text
POST /services/rest/exec-post
```

Не использовать для бизнес-функций Naumen:

```text
GET
PUT
PATCH
DELETE
```

---

# 7. Технический accessKey и пользовательская сессия

Необходимо чётко разделять два понятия.

## 7.1. Технический accessKey Naumen

`accessKey` используется только для доступа к механизму:

```text
/services/rest/exec-post
```

Он передаётся в query string:

```text
?accessKey=<accessKey>
```

`accessKey` не является пользовательским токеном.

`accessKey` не доказывает полномочия пользователя.

Так как `accessKey` находится во frontend, пользователь может увидеть его через DevTools.

Поэтому ни одна защищённая функция не должна выполнять действие только на основании наличия `accessKey`.

## 7.2. Пользовательский sessionToken

После успешной авторизации сервер возвращает:

```text
sessionToken
```

`sessionToken`:

* сохраняется в `localStorage`;
* не передаётся в URL;
* автоматически добавляется в JSON-тело защищённых запросов;
* проверяется каждой защищённой серверной функцией.

Каждая защищённая функция должна:

1. Получить `sessionToken` из `requestContent`.

2. Найти активную сессию.

3. Определить пользователя.

4. Проверить срок действия сессии.

5. Проверить роли пользователя.

6. Проверить права на конкретное действие.

7. Проверить права на конкретный объект.

8. Только после этого выполнить операцию.

Параметр `user`, передаваемый Naumen, разрешается использовать как дополнительный контекст.

Нельзя считать параметр `user` единственным механизмом авторизации, если frontend использует общий технический `accessKey`.

---

# 8. Конфигурация подключения

Создать файл:

```text
js/config.js
```

Пример:

```javascript
window.ITSM_CONFIG = {
    baseUrl: "https://replace-with-naumen-address",
    accessKey: "replace-with-access-key",
    moduleName: "modules.newItsmTest",
    requestTimeout: 30000,
    debug: true,
    defaultLanguage: "ru",
    defaultTheme: "light"
};
```

Требования:

1. Не размещать адрес сервера в HTML-файлах.

2. Не размещать `accessKey` в контроллерах страниц.

3. Не размещать имя модуля в каждом API-классе.

4. Все значения должны читаться из единого объекта конфигурации.

5. Не использовать реальные адреса и ключи в репозитории.

6. Использовать значения-заглушки.

7. В документации явно указать, что хранение постоянного `accessKey` во frontend небезопасно для промышленной эксплуатации.

8. Для прототипа это допускается, так как соответствует текущему механизму Naumen.

9. В будущем рекомендуется архитектура:

```text
Browser → Application Backend → Naumen Service Desk
```

10. Frontend должен быть спроектирован так, чтобы переход на backend-прокси потребовал минимальных изменений.

---

# 9. Общий транспортный REST-клиент

Создать единый класс:

```javascript
class NaumenApiClient
```

Файл:

```text
js/api/naumen-api-client.js
```

Класс отвечает только за транспорт:

* построение URL;
* выполнение POST;
* добавление технических параметров;
* добавление пользовательского `sessionToken`;
* сериализацию JSON;
* чтение JSON-ответа;
* timeout;
* отмену запроса;
* обработку HTTP-ошибок;
* обработку бизнес-ошибок;
* генерацию `requestId`;
* обработку окончания сессии.

Пример интерфейса:

```javascript
class NaumenApiClient {
    constructor(config, sessionProvider) {
        this.baseUrl = config.baseUrl;
        this.accessKey = config.accessKey;
        this.moduleName = config.moduleName;
        this.requestTimeout = config.requestTimeout || 30000;
        this.debug = Boolean(config.debug);
        this.sessionProvider = sessionProvider;
    }

    async exec(functionName, requestContent = {}, options = {}) {
        // Выполнение POST-запроса к Naumen exec-post.
    }
}
```

Предлагаемые параметры `options`:

```javascript
{
    auth: true,
    timeout: 30000,
    signal: null,
    includeLanguage: true
}
```

Для функции входа использовать:

```javascript
apiClient.exec("authLogin", credentials, {
    auth: false
});
```

Для защищённой функции:

```javascript
apiClient.exec("requestsGetList", request);
```

---

# 10. Построение URL Naumen

URL должен формироваться централизованно.

Пример:

```javascript
buildExecUrl(functionName) {
    const query = new URLSearchParams({
        accessKey: this.accessKey,
        func: `${this.moduleName}.${functionName}`,
        params: "requestContent,user"
    });

    return `${this.baseUrl}/services/rest/exec-post?${query.toString()}`;
}
```

Необходимо:

1. Использовать `URLSearchParams`.

2. Не собирать query string конкатенацией без кодирования.

3. Не передавать в query string:

   * `sessionToken`;
   * логин;
   * пароль;
   * идентификатор заявки;
   * фильтры;
   * бизнес-параметры.

---

# 11. Формирование JSON-тела

Все параметры серверной функции передаются одним JSON-объектом `requestContent`.

`NaumenApiClient` должен автоматически добавлять:

* `requestId`;
* `sessionToken`, если запрос защищён;
* `language`, если это требуется.

Пример:

```javascript
const requestId = createRequestId();

const payload = {
    ...requestContent,
    requestId
};

if (options.auth !== false) {
    const sessionToken = this.sessionProvider.getSessionToken();

    if (sessionToken) {
        payload.sessionToken = sessionToken;
    }
}

if (options.includeLanguage !== false) {
    payload.language = this.sessionProvider.getLanguage() || "ru";
}
```

`requestId` необходимо добавлять:

1. В JSON-тело:

```json
{
    "requestId": "generated-request-id"
}
```

2. Дополнительно в HTTP-заголовок:

```http
X-Request-ID: generated-request-id
```

Groovy-функция должна использовать `requestContent.requestId`.

Не следует рассчитывать, что произвольный HTTP-заголовок будет автоматически доступен внутри Groovy-функции.

---

# 12. Выполнение POST-запроса

Ориентировочная реализация:

```javascript
async exec(functionName, requestContent = {}, options = {}) {
    const url = this.buildExecUrl(functionName);
    const requestId = createRequestId();
    const controller = new AbortController();

    const externalSignal = options.signal || null;
    const timeout = options.timeout || this.requestTimeout;

    const payload = {
        ...requestContent,
        requestId
    };

    if (options.auth !== false) {
        const sessionToken = this.sessionProvider.getSessionToken();

        if (sessionToken) {
            payload.sessionToken = sessionToken;
        }
    }

    if (options.includeLanguage !== false) {
        payload.language =
            this.sessionProvider.getLanguage() ||
            window.ITSM_CONFIG.defaultLanguage ||
            "ru";
    }

    if (externalSignal) {
        externalSignal.addEventListener(
            "abort",
            () => controller.abort(),
            { once: true }
        );
    }

    const timeoutId = window.setTimeout(
        () => controller.abort(),
        timeout
    );

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Accept": "application/json",
                "X-Request-ID": requestId
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        const responseBody = await this.readResponseBody(response);

        if (!response.ok) {
            throw this.createHttpError(
                response.status,
                responseBody,
                requestId
            );
        }

        if (!responseBody || responseBody.success !== true) {
            const businessError = this.createBusinessError(
                responseBody,
                requestId
            );

            if (
                businessError.code === "SESSION_EXPIRED" ||
                businessError.code === "INVALID_SESSION"
            ) {
                this.sessionProvider.clear();
                this.redirectToLogin();
            }

            throw businessError;
        }

        return responseBody.data;
    } catch (error) {
        if (error.name === "AbortError") {
            throw this.createTimeoutError(requestId);
        }

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}
```

Код является ориентиром.

Необходимо самостоятельно реализовать:

* `readResponseBody`;
* `createHttpError`;
* `createBusinessError`;
* `createTimeoutError`;
* `redirectToLogin`;
* безопасное логирование;
* обработку пустого ответа;
* обработку некорректного JSON.

---

# 13. Формат ответов Naumen

Успешный ответ:

```json
{
    "success": true,
    "data": {},
    "requestId": "..."
}
```

Ошибка:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Ошибка проверки данных",
        "fieldErrors": {
            "title": "Поле обязательно"
        },
        "details": []
    },
    "requestId": "..."
}
```

`NaumenApiClient` должен проверять два уровня:

1. HTTP-статус.

2. Поле `success` в JSON.

Naumen может вернуть HTTP 200, даже если бизнес-функция завершилась ошибкой.

Поэтому нельзя считать HTTP 200 признаком успешной бизнес-операции.

Логика:

```javascript
if (!response.ok) {
    throw createHttpError(...);
}

if (!responseBody || responseBody.success !== true) {
    throw createBusinessError(...);
}

return responseBody.data;
```

Основные бизнес-коды ошибок:

```text
VALIDATION_ERROR
INVALID_CREDENTIALS
INVALID_SESSION
SESSION_EXPIRED
FORBIDDEN
NOT_FOUND
VERSION_CONFLICT
DUPLICATE
DEPENDENCY_EXISTS
SLA_NOT_FOUND
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
INTERNAL_ERROR
```

---

# 14. Конфликты версий и HTTP 409

Нельзя полагаться только на HTTP 409.

При конфликте версий сервер должен вернуть бизнес-ошибку:

```json
{
    "success": false,
    "error": {
        "code": "VERSION_CONFLICT",
        "message": "Объект был изменён другим пользователем",
        "fieldErrors": {},
        "details": []
    },
    "requestId": "..."
}
```

Если механизм Naumen позволяет управлять HTTP-статусом, дополнительно можно использовать HTTP 409.

Frontend обязан проверять:

```text
error.code = VERSION_CONFLICT
```

даже если HTTP-статус равен 200.

---

# 15. Предметные API-модули

Создать отдельные API-модули:

```text
js/api/auth-api.js
js/api/catalog-api.js
js/api/forms-api.js
js/api/requests-api.js
js/api/sla-api.js
js/api/users-api.js
js/api/files-api.js
js/api/dictionaries-api.js
```

Предметные API-модули:

* не вызывают `fetch`;
* не строят URL;
* не знают формат `exec-post`;
* вызывают только `NaumenApiClient.exec`.

Пример `AuthApi`:

```javascript
export class AuthApi {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    login(login, password) {
        return this.apiClient.exec(
            "authLogin",
            {
                login,
                password
            },
            {
                auth: false
            }
        );
    }

    logout() {
        return this.apiClient.exec("authLogout");
    }

    getCurrentUser() {
        return this.apiClient.exec("authGetCurrentUser");
    }

    refresh() {
        return this.apiClient.exec("authRefresh");
    }
}
```

Пример `CatalogApi`:

```javascript
export class CatalogApi {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getTree(params = {}) {
        return this.apiClient.exec("catalogGetTree", params);
    }

    getAvailableTree(params = {}) {
        return this.apiClient.exec(
            "catalogGetAvailableTree",
            params
        );
    }

    createFolder(folder) {
        return this.apiClient.exec(
            "catalogCreateFolder",
            {
                folder
            }
        );
    }

    updateFolder(folderId, changes, expectedVersion) {
        return this.apiClient.exec(
            "catalogUpdateFolder",
            {
                folderId,
                changes,
                expectedVersion
            }
        );
    }

    deleteFolder(folderId, expectedVersion) {
        return this.apiClient.exec(
            "catalogDeleteFolder",
            {
                folderId,
                expectedVersion
            }
        );
    }

    moveService(
        serviceId,
        targetFolderId,
        expectedVersion
    ) {
        return this.apiClient.exec(
            "catalogMoveService",
            {
                serviceId,
                targetFolderId,
                expectedVersion
            }
        );
    }
}
```

---

# 16. Список серверных функций Naumen

Использовать модуль:

```text
modules.newItsmTest
```

Полное имя функции:

```text
modules.newItsmTest.<functionName>
```

---

## 16.1. Аутентификация

```text
modules.newItsmTest.authLogin
modules.newItsmTest.authLogout
modules.newItsmTest.authRefresh
modules.newItsmTest.authGetCurrentUser
```

### Авторизация

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.authLogin&params=requestContent,user
```

Тело:

```json
{
    "login": "ivanov",
    "password": "password",
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Получение текущего пользователя

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.authGetCurrentUser&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Выход

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.authLogout&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "requestId": "generated-request-id"
}
```

---

## 16.2. Каталог услуг

```text
modules.newItsmTest.catalogGetTree
modules.newItsmTest.catalogGetAvailableTree
modules.newItsmTest.catalogGetFolder
modules.newItsmTest.catalogCreateFolder
modules.newItsmTest.catalogUpdateFolder
modules.newItsmTest.catalogDeleteFolder

modules.newItsmTest.catalogGetServices
modules.newItsmTest.catalogGetService
modules.newItsmTest.catalogCreateService
modules.newItsmTest.catalogUpdateService
modules.newItsmTest.catalogMoveService
modules.newItsmTest.catalogChangeServiceStatus
modules.newItsmTest.catalogGetServiceAvailability
modules.newItsmTest.catalogUpdateServiceAvailability
```

### Получение административного дерева

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogGetTree&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "includeArchived": false,
    "includeDrafts": true,
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Получение пользовательского дерева

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogGetAvailableTree&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Создание папки

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogCreateFolder&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "folder": {
        "title": {
            "ru": "Бухгалтерские услуги",
            "en": "Accounting services"
        },
        "parentFolderId": null,
        "sortOrder": 100,
        "status": "DRAFT"
    },
    "requestId": "generated-request-id"
}
```

### Обновление папки

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogUpdateFolder&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "folderId": "folder$123",
    "changes": {
        "title": {
            "ru": "Новое название",
            "en": "New title"
        },
        "sortOrder": 200
    },
    "expectedVersion": 4,
    "requestId": "generated-request-id"
}
```

### Удаление папки

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogDeleteFolder&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "folderId": "folder$123",
    "expectedVersion": 4,
    "requestId": "generated-request-id"
}
```

Если папка содержит подпапки или услуги, вернуть:

```text
DEPENDENCY_EXISTS
```

### Перемещение услуги

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogMoveService&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "serviceId": "service$123",
    "targetFolderId": "folder$456",
    "expectedVersion": 7,
    "requestId": "generated-request-id"
}
```

### Изменение статуса услуги

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.catalogChangeServiceStatus&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "serviceId": "service$123",
    "status": "PUBLISHED",
    "expectedVersion": 7,
    "requestId": "generated-request-id"
}
```

---

## 16.3. Формы

```text
modules.newItsmTest.formsGetList
modules.newItsmTest.formsGet
modules.newItsmTest.formsCreate
modules.newItsmTest.formsUpdate

modules.newItsmTest.formsGetVersions
modules.newItsmTest.formsGetVersion
modules.newItsmTest.formsCreateVersion
modules.newItsmTest.formsCloneVersion
modules.newItsmTest.formsSaveDraft
modules.newItsmTest.formsPublishVersion
```

### Получение списка форм

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.formsGetList&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "page": 1,
    "pageSize": 20,
    "filters": {
        "search": "",
        "statuses": []
    },
    "sort": [
        {
            "field": "updatedAt",
            "direction": "desc"
        }
    ],
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Создание новой версии

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.formsCreateVersion&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "formId": "form$123",
    "sourceVersionId": "formVersion$456",
    "schema": {
        "pages": []
    },
    "expectedFormVersion": 5,
    "requestId": "generated-request-id"
}
```

Frontend не вычисляет следующий номер версии.

Номер назначает серверная функция:

```text
formsCreateVersion
```

### Сохранение черновика

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.formsSaveDraft&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "formId": "form$123",
    "formVersionId": "formVersion$789",
    "schema": {
        "pages": []
    },
    "expectedVersion": 3,
    "requestId": "generated-request-id"
}
```

### Публикация версии

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.formsPublishVersion&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "formId": "form$123",
    "formVersionId": "formVersion$789",
    "expectedVersion": 6,
    "requestId": "generated-request-id"
}
```

---

## 16.4. Заявки

```text
modules.newItsmTest.requestsGetList
modules.newItsmTest.requestsCreate
modules.newItsmTest.requestsGet
modules.newItsmTest.requestsChangeStatus
modules.newItsmTest.requestsChangeAssignment
modules.newItsmTest.requestsAddComment
modules.newItsmTest.requestsGetComments
modules.newItsmTest.requestsGetHistory
modules.newItsmTest.requestsGetAttachments
modules.newItsmTest.requestsAddAttachment
modules.newItsmTest.requestsGetSla
modules.newItsmTest.requestsRecalculateSla
```

### Создание заявки

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.requestsCreate&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "serviceId": "service$123",
    "formId": "form$456",
    "formVersionId": "formVersion$789",
    "fieldValues": {
        "importance": "1",
        "urgency": "2",
        "system": "1C",
        "requestedFor": "employee$321"
    },
    "attachments": [],
    "requestId": "generated-request-id"
}
```

Сервер должен повторно проверить:

* доступ пользователя к услуге;
* статус услуги;
* актуальность выбранной версии формы;
* допустимость полей;
* обязательные поля;
* права на заявителя;
* вложения.

### Получение списка заявок

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.requestsGetList&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "page": 1,
    "pageSize": 20,
    "filters": {
        "number": "",
        "statuses": [],
        "serviceIds": [],
        "authorIds": [],
        "requestedForIds": [],
        "responsibleGroupIds": [],
        "assigneeIds": [],
        "slaBreached": null,
        "createdFrom": null,
        "createdTo": null
    },
    "sort": [
        {
            "field": "createdAt",
            "direction": "desc"
        }
    ],
    "requestId": "generated-request-id",
    "language": "ru"
}
```

### Изменение статуса

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.requestsChangeStatus&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "requestIdValue": "request$123",
    "newStatus": "IN_PROGRESS",
    "comment": "Заявка принята в работу",
    "expectedVersion": 8,
    "requestId": "generated-request-id"
}
```

Для идентификатора бизнес-заявки предпочтительно использовать поле:

```text
requestIdValue
```

или:

```text
entityId
```

чтобы не путать его с техническим `requestId`.

В итоговой архитектуре выбрать одно единое название.

Рекомендуемое название:

```text
entityId
```

Тогда тело:

```json
{
    "sessionToken": "user-session-token",
    "entityId": "request$123",
    "newStatus": "IN_PROGRESS",
    "comment": "Заявка принята в работу",
    "expectedVersion": 8,
    "requestId": "generated-request-id"
}
```

### Изменение ответственного

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.requestsChangeAssignment&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "entityId": "request$123",
    "responsibleGroupId": "team$456",
    "assigneeId": "employee$789",
    "expectedVersion": 9,
    "requestId": "generated-request-id"
}
```

### Добавление комментария

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.requestsAddComment&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "entityId": "request$123",
    "comment": {
        "type": "INTERNAL",
        "text": "Внутренний комментарий оператора"
    },
    "requestId": "generated-request-id"
}
```

Типы комментариев:

```text
PUBLIC
INTERNAL
```

---

## 16.5. SLA

```text
modules.newItsmTest.slaGetRules
modules.newItsmTest.slaGetRule
modules.newItsmTest.slaCreateRule
modules.newItsmTest.slaUpdateRule
modules.newItsmTest.slaDeleteRule
modules.newItsmTest.slaReorderRules
modules.newItsmTest.slaTestRules
modules.newItsmTest.slaCheckConflicts
modules.newItsmTest.slaCalculateForRequest

modules.newItsmTest.calendarsGetList
modules.newItsmTest.calendarsGet
modules.newItsmTest.calendarsCalculateDeadline
```

### Получение правил SLA

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.slaGetRules&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "serviceId": "service$123",
    "includeDisabled": true,
    "requestId": "generated-request-id"
}
```

### Изменение порядка правил

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.slaReorderRules&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "serviceId": "service$123",
    "ruleIds": [
        "slaRule$3",
        "slaRule$1",
        "slaRule$2"
    ],
    "expectedVersion": 11,
    "requestId": "generated-request-id"
}
```

### Тестирование правил SLA

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.slaTestRules&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "context": {
        "importance": "1",
        "urgency": "2",
        "system": "1C",
        "vip": false,
        "organizationIds": [
            "organization$123"
        ],
        "departmentId": "department$456",
        "serviceId": "service$789"
    },
    "requestId": "generated-request-id"
}
```

---

## 16.6. Пользователи и справочники

```text
modules.newItsmTest.usersGetList
modules.newItsmTest.usersGet
modules.newItsmTest.usersUpdate
modules.newItsmTest.usersGetCreatedRequests
modules.newItsmTest.usersGetAssignedRequests
modules.newItsmTest.usersGetGroupRequests

modules.newItsmTest.dictionariesGetGroups
modules.newItsmTest.dictionariesGetOrganizations
modules.newItsmTest.dictionariesGetDepartments
modules.newItsmTest.dictionariesGetItems
modules.newItsmTest.dictionariesSearchUsers
```

### Поиск пользователей

```text
POST <baseURL>/services/rest/exec-post?accessKey=<accessKey>&func=modules.newItsmTest.dictionariesSearchUsers&params=requestContent,user
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "search": "Иван",
    "page": 1,
    "pageSize": 20,
    "organizationIds": [],
    "departmentIds": [],
    "activeOnly": true,
    "requestId": "generated-request-id",
    "language": "ru"
}
```

---

# 17. Серверная пагинация

Все списочные функции должны поддерживать:

```json
{
    "page": 1,
    "pageSize": 20,
    "filters": {},
    "sort": []
}
```

Формат ответа:

```json
{
    "success": true,
    "data": {
        "items": [],
        "page": 1,
        "pageSize": 20,
        "total": 0,
        "totalPages": 0
    },
    "requestId": "..."
}
```

Сервер должен ограничивать максимальный `pageSize`.

Например:

```text
максимум 100
```

---

# 18. Формат серверных Groovy-функций

Groovy-функции должны быть написаны в стиле Naumen Service Desk.

Пример сигнатуры:

```groovy
Map authLogin(Map requestContent, def user)
```

Имена:

```text
authenticationService
sessionService
permissionService
requestService
catalogService
formService
slaService
```

в примерах являются проектными адаптерами.

Они не должны выдаваться за гарантированно существующие встроенные API Naumen.

Codex должен:

1. Либо реализовать проектный адаптер.

2. Либо создать интерфейс адаптера.

3. Либо оставить явный `TODO`.

4. Не выдумывать конкретные методы Naumen как достоверно существующие.

---

# 19. Пример Groovy-функции авторизации

```groovy
Map authLogin(Map requestContent, def user) {
    String requestId = requestContent?.requestId?.toString()
        ?: UUID.randomUUID().toString()

    try {
        String login = requestContent?.login?.toString()?.trim()
        String password = requestContent?.password?.toString()

        Map fieldErrors = [:]

        if (!login) {
            fieldErrors.login = 'Поле обязательно'
        }

        if (!password) {
            fieldErrors.password = 'Поле обязательно'
        }

        if (fieldErrors) {
            return errorResponse(
                'VALIDATION_ERROR',
                'Ошибка проверки данных',
                fieldErrors,
                [],
                requestId
            )
        }

        /*
         * TODO:
         * Подключить реальный механизм проверки логина и пароля
         * в Naumen Service Desk.
         *
         * authenticationService является проектным адаптером.
         *
         * Запрещено логировать пароль.
         */

        Map authenticatedUser = authenticationService.authenticate(
            login,
            password
        )

        if (!authenticatedUser) {
            return errorResponse(
                'INVALID_CREDENTIALS',
                'Неверный логин или пароль',
                [:],
                [],
                requestId
            )
        }

        /*
         * sessionService является проектным адаптером.
         * Он должен создать пользовательскую сессию,
         * сохранить только безопасные данные и вернуть token.
         */

        Map session = sessionService.createSession(
            authenticatedUser.id
        )

        return successResponse(
            [
                sessionToken: session.token,
                expiresAt: session.expiresAt,
                user: [
                    id: authenticatedUser.id,
                    login: authenticatedUser.login,
                    title: authenticatedUser.title,
                    roles: authenticatedUser.roles
                ]
            ],
            requestId
        )
    } catch (Exception exception) {
        logger.error(
            "authLogin failed, requestId=${requestId}",
            exception
        )

        return errorResponse(
            'INTERNAL_ERROR',
            'Внутренняя ошибка сервера',
            [:],
            [],
            requestId
        )
    }
}
```

---

# 20. Пример защищённой Groovy-функции

```groovy
Map requestsGetList(Map requestContent, def user) {
    String requestId = requestContent?.requestId?.toString()
        ?: UUID.randomUUID().toString()

    try {
        Map currentUser = sessionService.requireUser(
            requestContent?.sessionToken
        )

        permissionService.requireAnyRole(
            currentUser,
            [
                'USER',
                'OPERATOR',
                'SYSTEM_ADMIN'
            ]
        )

        int page = normalizePage(requestContent?.page)
        int pageSize = normalizePageSize(
            requestContent?.pageSize
        )

        Map filters = requestContent?.filters instanceof Map
            ? requestContent.filters
            : [:]

        List sort = requestContent?.sort instanceof List
            ? requestContent.sort
            : []

        Map result = requestService.findRequests(
            currentUser,
            filters,
            sort,
            page,
            pageSize
        )

        return successResponse(
            result,
            requestId
        )
    } catch (InvalidSessionException exception) {
        return errorResponse(
            'INVALID_SESSION',
            'Пользовательская сессия недействительна',
            [:],
            [],
            requestId
        )
    } catch (SessionExpiredException exception) {
        return errorResponse(
            'SESSION_EXPIRED',
            'Срок пользовательской сессии истёк',
            [:],
            [],
            requestId
        )
    } catch (SecurityException exception) {
        return errorResponse(
            'FORBIDDEN',
            'Недостаточно прав',
            [:],
            [],
            requestId
        )
    } catch (Exception exception) {
        logger.error(
            "requestsGetList failed, requestId=${requestId}",
            exception
        )

        return errorResponse(
            'INTERNAL_ERROR',
            'Внутренняя ошибка сервера',
            [:],
            [],
            requestId
        )
    }
}
```

---

# 21. Вспомогательные Groovy-функции

```groovy
Map successResponse(
    def data,
    String requestId
) {
    return [
        success: true,
        data: data,
        requestId: requestId
    ]
}

Map errorResponse(
    String code,
    String message,
    Map fieldErrors,
    List details,
    String requestId
) {
    return [
        success: false,
        error: [
            code: code,
            message: message,
            fieldErrors: fieldErrors ?: [:],
            details: details ?: []
        ],
        requestId: requestId
    ]
}

int normalizePage(def value) {
    int page = value instanceof Number
        ? value.intValue()
        : 1

    return page > 0 ? page : 1
}

int normalizePageSize(def value) {
    int pageSize = value instanceof Number
        ? value.intValue()
        : 20

    if (pageSize < 1) {
        return 20
    }

    return Math.min(pageSize, 100)
}
```

---

# 22. Требования ко всем Groovy-функциям

Каждая функция должна:

1. Проверять обязательные параметры.

2. Проверять типы параметров.

3. Нормализовать строки.

4. Проверять пользовательскую сессию.

5. Проверять срок действия сессии.

6. Проверять роли.

7. Проверять права на конкретный объект.

8. Не доверять данным frontend.

9. Не доверять переданному `userId` без проверки.

10. Не доверять переданной рабочей группе без проверки.

11. Проверять optimistic locking.

12. Возвращать единый формат ответа.

13. Возвращать единый формат ошибки.

14. Не раскрывать stack trace пользователю.

15. Добавлять `requestId`.

16. Записывать значимые действия в журнал.

17. Не логировать:

    * пароль;
    * `sessionToken`;
    * `accessKey`;
    * содержимое конфиденциальных полей.

18. Использовать отдельный сервисный слой.

19. Не смешивать REST-обвязку и бизнес-логику.

20. Не выполнять SQL непосредственно из frontend-контекста.

21. Не использовать реальные пароли, токены и URL в примерах.

---

# 23. Версионирование форм

Реализовать серверную бизнес-логику со следующими правилами:

1. У формы есть стабильный `formId`.

2. У каждой версии есть собственный `formVersionId`.

3. Номер версии увеличивается автоматически.

4. Номер версии назначает сервер.

5. Frontend не определяет следующий номер версии.

6. Опубликованную версию нельзя изменить напрямую.

7. Старую версию нельзя изменить напрямую.

8. При редактировании опубликованной или старой версии создаётся новый черновик.

9. Новая версия сначала имеет статус:

```text
DRAFT
```

10. После публикации версия получает статус:

```text
PUBLISHED
```

11. Предыдущая опубликованная версия остаётся доступной.

12. Старые версии нельзя удалить.

13. Старые заявки продолжают ссылаться на старую версию.

14. Для одной формы рекомендуется только один активный черновик.

15. Конкурентное создание версий обрабатывает сервер.

16. При конфликте вернуть:

```text
VERSION_CONFLICT
```

17. При сохранении черновика использовать `expectedVersion`.

18. При публикации использовать `expectedVersion`.

19. История версий должна сохранять:

    * автора;
    * дату создания;
    * источник;
    * дату публикации;
    * автора публикации.

---

# 24. Логика SLA

Реализовать чистую JavaScript-функцию:

```javascript
matchSlaRules(requestContext, rules)
```

Функция нужна для:

* предварительного просмотра;
* тестирования;
* подсветки совпадений;
* unit-тестов.

Сервер остаётся источником истины.

Алгоритм:

1. Получить включённые правила.

2. Отсортировать правила по полю `order`.

3. Проверить правила по порядку.

4. Собрать все совпавшие правила.

5. Если совпадений нет:

   * вернуть отсутствие SLA;
   * либо SLA по умолчанию, если он настроен.

6. Если совпадение одно:

   * применить его.

7. Если совпадений несколько:

   * применить первое;
   * вернуть список конфликтующих правил;
   * записать конфликт в историю заявки.

8. Рассчитать срок реакции через календарную REST-функцию Naumen.

9. Рассчитать срок решения через календарную REST-функцию Naumen.

10. Учитывать рабочий календарь.

11. Учитывать праздники.

12. Учитывать часовой пояс.

13. Учитывать приостановленные статусы.

14. Пересчитывать SLA при создании заявки.

15. Пересчитывать SLA при смене статуса.

16. При пересчёте добавлять запись в историю.

---

# 25. Локализация

Создать механизм:

```javascript
I18n.t("requests.status.NEW")
```

Словари:

```text
js/i18n/ru.js
js/i18n/en.js
```

Пример:

```javascript
export const ru = {
    common: {
        save: "Сохранить",
        cancel: "Отмена"
    },
    requests: {
        status: {
            NEW: "Новая",
            IN_PROGRESS: "В работе"
        }
    }
};
```

Требования:

1. Не размещать пользовательские тексты напрямую в контроллерах страниц.

2. Исключения:

   * технические значения;
   * временные диагностические сообщения;
   * комментарии разработчика.

3. Язык сохраняется локально.

4. Язык также передаётся в JSON-теле REST-запроса.

5. Сервер может возвращать локализованные справочники.

---

# 26. Светлая и тёмная тема

Использовать Bootstrap theme attribute:

```html
<html data-bs-theme="light">
```

и:

```html
<html data-bs-theme="dark">
```

Требования:

1. Выбранная тема сохраняется в `localStorage`.

2. Тема применяется до отображения основного интерфейса, чтобы избежать мигания.

3. Администратор может определить тему по умолчанию.

4. Пользователь может переключать тему, если это разрешено.

---

# 27. UI-требования

На каждой странице должны поддерживаться состояния:

```text
loading
empty
error
ready
forbidden
```

Использовать:

* Bootstrap navbar;
* Bootstrap sidebar;
* Bootstrap cards;
* Bootstrap tables;
* Bootstrap forms;
* Bootstrap modal;
* Bootstrap toast;
* Bootstrap badges;
* Bootstrap pagination;
* Bootstrap tabs;
* Bootstrap offcanvas при необходимости.

Не использовать браузерные:

```text
alert
confirm
prompt
```

кроме временной диагностики.

Создать переиспользуемые:

* модальные окна;
* подтверждения;
* уведомления;
* индикаторы загрузки;
* состояния ошибки;
* пустые состояния;
* состояние недостатка прав.

---

# 28. Безопасность

1. Не вставлять данные сервера через `innerHTML`, если они не прошли безопасную обработку.

2. Для обычного текста использовать `textContent`.

3. Не хранить пароль.

4. Не передавать пользовательский `sessionToken` в query string.

5. Не передавать логин и пароль в query string.

6. Технический `accessKey` передаётся в query string только потому, что этого требует Naumen `exec-post`.

7. Не полагаться только на скрытие кнопок.

8. Все права проверяются сервером.

9. Проверять тип вложений.

10. Проверять размер вложений.

11. Проверять расширение вложений.

12. Проверять MIME type.

13. Не доверять имени файла.

14. Не разрешать произвольное выполнение JavaScript из SurveyJS-схемы.

15. Ограничить набор допустимых SurveyJS expressions.

16. Не разрешать форме обращаться к произвольному внешнему URL.

17. Все справочники должны загружаться только через разрешённые серверные функции.

18. Добавить защиту от повторной отправки формы.

19. У кнопок сохранения показывать состояние выполнения.

20. Обрабатывать `VERSION_CONFLICT`.

21. Для редактируемых сущностей использовать:

    * `version`;
    * либо `updatedAt`;
    * предпочтительно отдельное числовое поле `version`.

22. Не логировать `sessionToken`.

23. Не логировать `accessKey`.

24. Не логировать пароль.

25. Не включать реальные секреты в репозиторий.

---

# 29. Вложения

Обычные параметры передаются в JSON.

Конкретный файловый API Naumen необходимо уточнить отдельно.

До уточнения реализовать абстрактный интерфейс:

```javascript
filesApi.upload({
    entityType: "REQUEST",
    entityId: requestId,
    file
});
```

Не выдумывать конкретный файловый API Naumen как реально существующий.

Если для прототипа используется Base64, серверная функция может называться:

```text
modules.newItsmTest.filesUpload
```

Тело:

```json
{
    "sessionToken": "user-session-token",
    "entityType": "REQUEST",
    "entityId": "request$123",
    "file": {
        "name": "document.pdf",
        "contentType": "application/pdf",
        "size": 102400,
        "contentBase64": "..."
    },
    "requestId": "generated-request-id"
}
```

Обязательно:

* установить ограничение размера;
* проверить расширение;
* проверить MIME type;
* не доверять имени файла;
* не использовать Base64 для больших файлов без отдельной оценки;
* отметить файловую интеграцию как требующую проверки на реальном Naumen.

---

# 30. Unit-тесты

Проект не использует сборщик.

Создать браузерный test runner.

Можно использовать QUnit, подключаемый обычным `<script>`.

Создать:

```text
tests/test-runner.html
```

Покрыть unit-тестами:

1. Проверку ролей.

2. Проверку доступности услуги.

3. Валидацию REST-ответов.

4. Формирование URL `exec-post`.

5. Кодирование query string.

6. Добавление `requestId`.

7. Добавление `sessionToken`.

8. Отсутствие `sessionToken` при `auth: false`.

9. Обработку HTTP-ошибок.

10. Обработку бизнес-ошибок при HTTP 200.

11. Обработку `SESSION_EXPIRED`.

12. Обработку `INVALID_SESSION`.

13. Обработку timeout.

14. Версионирование форм.

15. Сопоставление SLA-правил.

16. Оператор `ANY`.

17. Операторы SLA:

    * равно;
    * не равно;
    * входит в список;
    * не входит в список;
    * пусто;
    * не пусто;
    * диапазон.

18. Пересечение SLA-правил.

19. Форматирование времени SLA.

20. Локализацию.

21. Защиту от повторной отправки.

22. Очистку пользовательской сессии.

---

# 31. Порядок реализации

Не пытаться реализовать весь проект одним большим изменением.

Работать вертикальными частями:

1. Архитектура и документация.

2. Общая структура проекта.

3. `NaumenApiClient`.

4. Пользовательская сессия.

5. Авторизация и роли.

6. Общий layout.

7. Локализация.

8. Светлая и тёмная тема.

9. Список форм.

10. Редактор формы и версионирование.

11. Редактор каталога.

12. Пользовательский каталог.

13. Форма создания заявки.

14. Список заявок.

15. Карточка заявки.

16. Карточка пользователя.

17. SLA.

18. Вложения.

19. Unit-тесты.

20. Финальная документация.

Для каждой вертикальной части:

1. Сначала изучить существующий код.

2. Перечислить затрагиваемые файлы.

3. Написать краткий план.

4. Реализовать только текущую часть.

5. Не переписывать несвязанные части.

6. Проверить весь diff.

7. Проверить отсутствие дублирования.

8. Добавить unit-тесты.

9. Обновить документацию.

10. Перечислить известные ограничения.

11. Не заявлять о проверке, если она не выполнялась.

---

# 32. Критерии готовности

Работа считается готовой, если:

1. Созданы все 10 HTML-страниц.

2. Страницы запускаются без npm и сборки.

3. Страницы работают через статический HTTP-сервер.

4. Нет копирования общего JavaScript-кода.

5. Нет копирования общих CSS-правил.

6. Все REST-вызовы идут через `NaumenApiClient`.

7. `fetch` используется только в `naumen-api-client.js`.

8. Все бизнес-операции вызываются через:

```text
POST /services/rest/exec-post
```

9. В query string передаются только:

```text
accessKey
func
params
```

10. Все бизнес-параметры передаются в JSON-теле.

11. Пользовательский `sessionToken` не передаётся в URL.

12. Реализована авторизация.

13. Реализована пользовательская сессия.

14. Реализован выход.

15. Реализована обработка окончания сессии.

16. Реализована проверка ролей.

17. Реализован каталог с папками и подпапками.

18. Реализована настройка доступности услуг.

19. Реализован SurveyJS Creator.

20. Реализовано версионирование форм.

21. Старые версии форм нельзя изменить или удалить.

22. Заявка ссылается на конкретную версию формы.

23. Реализован список заявок.

24. Реализована карточка заявки.

25. Реализованы публичные комментарии.

26. Реализованы внутренние комментарии.

27. Реализованы рабочая группа и персональный ответственный.

28. Реализована история изменений.

29. Реализованы вложения или подготовлен проверяемый адаптер.

30. Реализованы сроки реакции и решения.

31. Реализован редактор SLA.

32. Реализована запись конфликта SLA.

33. Реализована карточка пользователя.

34. Реализованы русский и английский языки.

35. Реализованы светлая и тёмная темы.

36. Добавлены unit-тесты.

37. Добавлены примеры Groovy-функций.

38. Созданы:

    * `README.md`;
    * `docs/architecture.md`;
    * `docs/rest-api.md`;
    * `docs/permissions.md`;
    * `docs/running.md`;
    * `docs/security.md`;
    * `docs/naumen-integration.md`.

39. В коде нет реальных:

    * адресов;
    * accessKey;
    * sessionToken;
    * паролей.

40. Неизвестные методы Naumen отмечены `TODO`.

41. Проектные адаптеры не выдаются за встроенные API Naumen.

---

# 33. Формат результата после каждого этапа

После завершения каждой вертикальной части показать:

```text
1. Что реализовано.
2. Какие файлы созданы.
3. Какие файлы изменены.
4. Какие серверные функции используются.
5. Какие JSON-контракты используются.
6. Какие unit-тесты добавлены.
7. Какие проверки выполнены.
8. Что пока не реализовано.
9. Какие решения требуют проверки на реальном Naumen.
10. Какие известны ограничения.
```

Не заявлять, что функция работает, если она не была проверена.

Не маскировать незавершённую реализацию статическими данными.

Не заменять REST-вызовы фиктивными массивами, если это явно не включено как демонстрационный режим.

Не выполнять несвязанный рефакторинг без необходимости.

Не создавать весь проект одним огромным изменением.

Сначала подготовить архитектуру, затем реализовывать проект небольшими вертикальными частями.
