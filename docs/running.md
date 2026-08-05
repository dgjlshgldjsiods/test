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

## Зависимости этапа 2

Bootstrap 5.3.3 временно подключен с jsDelivr CDN с integrity и crossorigin. Поэтому для полного оформления и работы modal/toast браузеру требуется доступ к CDN.

TODO(DEPENDENCIES): на следующем подходящем этапе разместить проверенные фиксированные файлы Bootstrap, SurveyJS и QUnit локально в vendor и изменить ссылки на same-origin. До этого offline-запуск покажет содержимое, но без Bootstrap-оформления.

## Конфигурация

js/config.js содержит только placeholder baseUrl и accessKey. На этапе 2 сетевые вызовы отсутствуют. Реальные секреты нельзя коммитить.

## Диагностика

- Сервер должен отдавать JavaScript с корректным MIME type.
- В DevTools не должно быть 404 для локальных CSS и JS.
- Пути admin-страниц начинаются с ../ для общих ресурсов.
- Если Bootstrap CDN недоступен, проверьте сеть; бизнес-функциональность на этом этапе отсутствует.
