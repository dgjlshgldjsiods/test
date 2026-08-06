# Запуск проекта

## Требования

Нужен любой статический HTTP-сервер. npm и сборка не требуются. Открытие через file:// не поддерживается из-за browser ES modules.

## Python

Из корня репозитория:

    python3 -m http.server 8000

Открыть:

    http://localhost:8000/login.html

## Проверяемые страницы

    /login.html
    /service-catalog.html
    /service-form.html
    /requests.html
    /request-card.html
    /profile.html
    /admin/catalog-editor.html
    /admin/forms.html
    /admin/form-editor.html
    /admin/sla-editor.html

## Браузерные зависимости

Bootstrap 5.3.3 подключен с jsDelivr CDN. Страница `admin/form-editor.html` дополнительно подключает официальные браузерные пакеты `survey-core`, `survey-js-ui`, `survey-creator-core` и `survey-creator-js` с unpkg по схеме из документации SurveyJS. Для редактора требуется коммерческая лицензия SurveyJS Creator и доступ к CDN.

TODO(DEPENDENCIES): разместить лицензированные, проверенные и фиксированные версии SurveyJS локально в `vendor`, добавить SRI/самостоятельное размещение и изменить ссылки на same-origin. Сейчас SurveyJS URL следуют официальному примеру без фиксации версии, поэтому воспроизводимость и offline-запуск редактора ограничены.

## Конфигурация

js/config.js содержит только placeholder baseUrl и accessKey. Реальные секреты нельзя коммитить. defaultLanguage/defaultTheme задают первоначальные значения; пользовательский выбор сохраняется в localStorage под ключами itsm.language и itsm.theme.

`moduleName` должен совпадать с именем опубликованного модуля Groovy-функций; проектное значение —
`modules.newItsmTest`. `baseUrl` задаётся без завершающего `/`. Подробный порядок публикации и
предупреждение об accessKey приведены в README и `docs/naumen-integration.md`.

## Unit-тесты

После запуска сервера открыть:

    http://localhost:8000/tests/test-runner.html

Тесты выполняются QUnit непосредственно в браузере. Для них требуется доступ к CDN QUnit.

## Диагностика

- Сервер должен отдавать JavaScript с корректным MIME type.
- В DevTools не должно быть 404 для локальных CSS и JS.
- Пути admin-страниц начинаются с ../ для общих ресурсов.
- Если Bootstrap или SurveyJS CDN недоступен, интерфейс либо редакторы не загрузятся. Предметные функции дополнительно требуют настроенный `js/config.js` и развёрнутые Groovy-функции/адаптеры Naumen.
