export const ru = Object.freeze({
  common: {
    appName: 'ITSM', prototype: 'Прототип', user: 'Пользователь',
    logout: 'Выйти', cancel: 'Отмена', continue: 'Продолжить', close: 'Закрыть',
    search: 'Найти', retry: 'Повторить', edit: 'Редактировать', save: 'Сохранить', yes: 'Да', no: 'Нет',
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
  },
  catalogEditor: {
    tree: 'Дерево каталога', newRootFolder: 'Новая папка', newSubfolder: 'Создать подпапку',
    newService: 'Создать услугу', createFolder: 'Создание папки', editFolder: 'Редактирование папки',
    createService: 'Создание услуги', editService: 'Редактирование услуги', deleteFolder: 'Удалить папку',
    deleteConfirm: 'Удалить пустую папку?', folderNotEmpty: 'Можно удалить только пустую папку.',
    empty: 'Каталог пока пуст.', chooseItem: 'Выберите элемент дерева или создайте новый.',
    loadError: 'Не удалось загрузить дерево каталога.', itemLoadError: 'Не удалось загрузить элемент каталога.',
    commandError: 'Не удалось сохранить изменения.', versionConflict: 'Объект уже изменён другим пользователем. Перезагрузите дерево.',
    titleRu: 'Название (RU)', titleEn: 'Название (EN)', shortRu: 'Краткое описание (RU)', shortEn: 'Краткое описание (EN)',
    descriptionRu: 'Описание (RU)', descriptionEn: 'Описание (EN)', icon: 'Код иконки',
    code: 'Код', sortOrder: 'Порядок отображения', status: 'Статус', form: 'Форма', formVersion: 'Опубликованная версия формы',
    group: 'Рабочая группа', assignee: 'Ответственный', sla: 'SLA-политика', availability: 'Доступность',
    users: 'Пользователи', departments: 'Подразделения', organizations: 'Организации', notSelected: 'Не выбрано',
    move: 'Переместить услугу', saveBeforeMove: 'Сохраните или отмените текущие изменения перед перемещением.',
    finishEditing: 'Сначала сохраните или отмените текущие изменения.'
  },
  serviceCatalog: {
    loadError: 'Не удалось загрузить доступные услуги.', searchPlaceholder: 'Поиск по каталогу',
    viewMode: 'Режим отображения', cards: 'Карточки', list: 'Список', folders: 'Папки каталога',
    allServices: 'Все услуги', breadcrumbs: 'Навигационная цепочка', root: 'Каталог',
    empty: 'В этой папке нет доступных услуг.', searchEmpty: 'По вашему запросу ничего не найдено.'
  },
  serviceForm: {
    missingService: 'Не указан идентификатор услуги.', unavailable: 'Услуга не найдена или недоступна.',
    formNotConfigured: 'Для услуги не настроена форма.', formUnavailable: 'Опубликованная версия формы недоступна.',
    unsafeSchema: 'Схема формы содержит неподдерживаемые или небезопасные элементы.',
    loadError: 'Не удалось загрузить форму услуги.', form: 'Форма заявки', submit: 'Отправить заявку',
    submitting: 'Отправка…', validationError: 'Заполните обязательные поля и исправьте ошибки.',
    serverValidationError: 'Сервер отклонил значения формы. Проверьте введённые данные.',
    submitError: 'Не удалось создать заявку.', attachments: 'Вложения', chooseFiles: 'Выбрать файлы',
    attachmentsUnavailable: 'Файловый адаптер Naumen ещё не подтверждён. Добавление вложений временно недоступно.'
  },
  requests: {
    apply: 'Применить', moreFilters: 'Ещё фильтры', empty: 'Заявки по заданным условиям не найдены.',
    loadError: 'Не удалось загрузить список заявок.',
    filters: {
      search: 'Поиск', number: 'Номер', status: 'Статус', any: 'Любое значение', title: 'Название',
      service: 'Услуга', author: 'Автор', requestedFor: 'Заказчик', group: 'Рабочая группа',
      assignee: 'Ответственный', createdFrom: 'Создана с', createdTo: 'Создана по',
      slaBreached: 'Нарушение SLA', reactionFrom: 'Реакция с', reactionTo: 'Реакция по',
      resolutionFrom: 'Решение с', resolutionTo: 'Решение по'
    },
    filterValue: { true: 'Нарушен', false: 'Не нарушен' },
    columns: {
      number: 'Номер', title: 'Название', service: 'Услуга', author: 'Автор', status: 'Статус',
      group: 'Рабочая группа', assignee: 'Ответственный', reaction: 'Срок реакции',
      resolution: 'Срок решения', sla: 'SLA', createdAt: 'Создана'
    },
    status: {
      NEW: 'Новая', REGISTERED: 'Зарегистрирована', IN_PROGRESS: 'В работе', WAITING_USER: 'Ожидает пользователя',
      RESOLVED: 'Решена', CLOSED: 'Закрыта', CANCELLED: 'Отменена', UNKNOWN: 'Неизвестно'
    },
    sla: { paused: 'Приостановлен', breached: 'Нарушен', onTime: 'В срок' }
  },
  requestCard: {
    missingId: 'Не указан идентификатор заявки.', loadError: 'Не удалось загрузить карточку заявки.',
    service: 'Услуга', author: 'Автор', requestedFor: 'Заказчик', createdAt: 'Создана',
    group: 'Рабочая группа', assignee: 'Ответственный', submittedForm: 'Заполненная форма',
    changeStatus: 'Изменить статус', statusComment: 'Комментарий к изменению статуса',
    assignment: 'Назначение', notAssigned: 'Не назначен', assignmentError: 'Не удалось изменить назначение.',
    assignmentLoadError: 'Не удалось загрузить справочники назначения.', commandError: 'Не удалось выполнить операцию.',
    versionConflict: 'Заявка уже изменена другим пользователем. Перезагрузите карточку.',
    comments: 'Комментарии', commentText: 'Текст комментария', commentType: 'Тип комментария',
    publicComment: 'Публичный', internalComment: 'Внутренний', addComment: 'Добавить комментарий',
    noComments: 'Комментариев пока нет.', commentError: 'Не удалось добавить комментарий.', commentsLoadError: 'Не удалось загрузить комментарии.',
    commentTypes: { PUBLIC: 'Публичный', INTERNAL: 'Внутренний' },
    history: 'История', noHistory: 'История пока пуста.', historyLoadError: 'Не удалось загрузить историю.',
    events: {
      CREATED: 'Заявка создана', STATUS_CHANGED: 'Статус изменён', ASSIGNMENT_CHANGED: 'Назначение изменено',
      FIELDS_CHANGED: 'Поля изменены', COMMENT_ADDED: 'Добавлен комментарий', ATTACHMENT_ADDED: 'Добавлено вложение',
      SLA_CALCULATED: 'SLA рассчитан', SLA_PAUSED: 'SLA приостановлен', SLA_RESUMED: 'SLA возобновлён',
      SLA_RULE_CONFLICT: 'Конфликт определения SLA', UNKNOWN: 'Изменение заявки'
    },
    sla: 'SLA', reactionDeadline: 'Срок реакции', resolutionDeadline: 'Срок решения',
    remainingReaction: 'Осталось на реакцию', remainingResolution: 'Осталось на решение', minutes: '{count} мин.',
    attachments: 'Вложения', noAttachments: 'Вложений нет.',
    attachmentReadOnly: 'Добавление вложений будет реализовано после подтверждения файлового адаптера Naumen.'
  }
});
