export const ru = Object.freeze({
  common: {
    appName: 'ITSM', prototype: 'Прототип', user: 'Пользователь',
    logout: 'Выйти', cancel: 'Отмена', continue: 'Продолжить', close: 'Закрыть',
    search: 'Найти', retry: 'Повторить', edit: 'Редактировать', yes: 'Да', no: 'Нет',
    skipToContent: 'К содержимому', language: 'Язык', theme: 'Тема',
    lightTheme: 'Светлая', darkTheme: 'Тёмная', stageCaption: 'Базовая структура интерфейса'
  },
  nav: {
    main: 'Основная навигация', catalog: 'Каталог услуг', requests: 'Заявки',
    profile: 'Профиль', catalogEditor: 'Редактор каталога', forms: 'Формы', sla: 'SLA'
  },
  states: {
    loadingTitle: 'Загрузка', loading: 'Загрузка…', sessionLoading: 'Проверяем пользовательскую сессию…',
    emptyTitle: 'Нет данных', empty: 'Здесь пока ничего нет.',
    errorTitle: 'Произошла ошибка', error: 'Не удалось загрузить данные.',
    sessionError: 'Не удалось проверить пользовательскую сессию. Повторите попытку позже.',
    forbiddenTitle: 'Доступ запрещён', forbidden: 'У вас нет доступа к этому разделу.'
  },
  login: {
    title: 'Вход в ITSM', subtitle: 'Введите учётные данные пользователя.',
    login: 'Логин', password: 'Пароль', submit: 'Войти', pending: 'Вход…',
    loginRequired: 'Введите логин.', passwordRequired: 'Введите пароль.',
    invalidCredentials: 'Неверный логин или пароль.', error: 'Не удалось выполнить вход. Повторите попытку позже.'
  },
  pages: {
    stub: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.',
    login: 'Вход', serviceCatalog: 'Каталог услуг', serviceForm: 'Создание заявки',
    requests: 'Заявки', requestCard: 'Карточка заявки', profile: 'Профиль',
    catalogEditor: 'Редактор каталога', forms: 'Формы', formEditor: 'Редактор формы', slaEditor: 'Настройка SLA'
  },
  pagination: {
    label: 'Навигация по страницам', previous: 'Назад', next: 'Вперёд', total: 'Всего: {total}'
  },
  forms: {
    search: 'Поиск форм', searchPlaceholder: 'Название или код', statusFilter: 'Статус формы',
    allStatuses: 'Все статусы', create: 'Создать форму', history: 'История версий',
    empty: 'Формы по заданным условиям не найдены.', loadError: 'Не удалось загрузить список форм.',
    notPublished: 'Не опубликована',
    columns: {
      code: 'Код', title: 'Название', status: 'Статус', publishedVersion: 'Опубликованная версия',
      draft: 'Черновик', updatedAt: 'Изменена', actions: 'Действия'
    },
    status: { DRAFT: 'Черновик', PUBLISHED: 'Опубликована', ARCHIVED: 'В архиве', UNKNOWN: 'Неизвестно' }
  },
  formEditor: {
    code: 'Код', titleRu: 'Название (RU)', titleEn: 'Название (EN)', creator: 'Конструктор формы',
    create: 'Создать', save: 'Сохранить черновик', saved: 'Черновик сохранён', publish: 'Опубликовать',
    publishConfirm: 'После публикации эту версию нельзя будет изменить. Продолжить?',
    historyTitle: 'История версий', backToEditor: 'К редактору', viewVersion: 'Просмотреть',
    createDraft: 'Создать черновик из версии', openDraft: 'Открыть активный черновик',
    readOnly: 'Эта версия доступна только для чтения. Для изменения создайте новый черновик.',
    readOnlyWithDraft: 'Эта версия доступна только для чтения. У формы уже есть активный черновик.',
    version: 'Версия {number}', versionStatus: 'v{number} · {status}', noVersions: 'Версий пока нет.',
    activeDraftExists: 'У формы уже есть активный черновик.', versionConflict: 'Версия уже изменена другим пользователем. Перезагрузите страницу.',
    commandError: 'Не удалось выполнить операцию.', loadError: 'Не удалось загрузить форму.',
    missingFormId: 'Не указан идентификатор формы.', metadataRequired: 'Заполните код и русское название формы.',
    creatorUnavailable: 'SurveyJS Creator не загружен. Проверьте доступ к CDN.'
  }
});
