export const ru = Object.freeze({
  common: {
    appName: 'ITSM', prototype: 'Прототип', user: 'Пользователь',
    logout: 'Выйти', cancel: 'Отмена', continue: 'Продолжить', close: 'Закрыть',
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
  }
});
