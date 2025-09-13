export const ru: Record<string, string> = {
  // Navbar / Auth
  'nav.bom': 'Конструктор BOM',
  'nav.eoq': 'Экономичный размер заказа (EOQ)',
  'nav.mrp': 'Планирование потребностей (MRP)',
  'nav.about': 'О проекте',
  'auth.login': 'Войти',
  'auth.logout': 'Выйти',

  // Auth errors
  'auth.error.unknown': 'Неизвестная ошибка',
  'auth.error.google': 'Ошибка входа через Google',
  'auth.error.passwordPolicy': 'Пароль не короче 8 символов, со строчной, заглавной и спецсимволом.',

  // Common
  'loading': 'Загрузка…',

  // Login
  'login.title.signIn': 'Вход',
  'login.title.signUp': 'Создать аккаунт',
  'login.email': 'Email',
  'login.password': 'Пароль',
  'login.password.policy': 'Не менее 8 символов, со строчной, заглавной и спецсимволом.',
  'login.btn.signIn': 'Войти',
  'login.btn.signUp': 'Создать аккаунт',
  'login.btn.google': 'Войти через Google',
  'login.toggle.toSignIn': 'У меня уже есть аккаунт',
  'login.toggle.toSignUp': 'Создать аккаунт',

  // Complete profile
  'profile.title': 'Заполните профиль',
  'profile.firstName': 'Имя',
  'profile.lastName': 'Фамилия',
  'profile.btn.save': 'Сохранить',
  'profile.error.missing': 'Пожалуйста, заполните все поля.',
  'profile.error.save': 'Ошибка при сохранении.',

  // Folders
  'folders.title': 'Мои папки',
  'folders.new.placeholder': 'Новая папка',
  'folders.new.create': 'Создать',
  'folders.rename.save': 'Сохранить',
  'folders.rename.cancel': 'Отмена',
  'folders.rename.placeholder': 'Имя папки',
  'folders.actions.rename': 'Переименовать',
  'folders.actions.delete': 'Удалить',
  'folders.delete.confirm': 'Удалить папку "{name}"? Это также удалит её компоненты и BOM.',

  // Component form
  'form.section.add': 'Добавить компонент',
  'form.section.edit': 'Редактировать компонент',
  'form.folder': 'Папка',
  'form.name': 'Название',
  'form.add': 'Добавить',
  'form.save': 'Сохранить',
  // Placeholders for ComponentForm
  'form.placeholder.leadTime': 'Lead Time',
  'form.placeholder.onHand': 'Количество на складе',
  'form.placeholder.lotSize': 'Размер партии',
  'form.placeholder.unitCost': 'Себестоимость',
  'form.placeholder.orderingCost': 'Издержки заказа',
  'form.placeholder.carryingCost': 'Издержки хранения',

  // Save BOM modal
  'modal.saveBom.title': 'Сохранить BOM',
  'modal.saveBom.chooseFolder': 'В какую папку сохранить BOM?',
  'modal.saveBom.bomName': 'Имя BOM',
  'modal.saveBom.selectFolder': 'Выберите папку',

  // Common modal
  'modal.cancel': 'Отмена',
  'modal.confirm': 'Сохранить',

  // Import BOM modal
  'modal.importBom.title': 'Импортировать этот BOM',
  'modal.importBom.question': 'Что сделать с текущим полотном?',
  'modal.importBom.add': 'Добавить',
  'modal.importBom.replace': 'Заменить',

  // Canvas
  'canvas.save': 'Сохранить BOM',
  'split.resizeHint': 'Потяните, чтобы изменить размер',

  // Toasts
  'toast.bom.invalid': 'Некорректный BOM',
  'toast.bom.missingRoot': 'BOM не найден (нет корня)',
  'toast.bom.saved': 'BOM успешно сохранён!',
  'toast.bom.saveError': 'Ошибка при сохранении BOM.',
  'toast.folders.loadError': 'Не удалось загрузить папки',

  // Component list and deletion
  'list.bom': 'BOM',
  'list.component': 'компонент',
  'list.what.bom': 'этот BOM {name}',
  'list.what.component': 'этот компонент {name}',
  'list.actions.delete': 'Удалить',
  'list.actions.edit': 'Править',
  'list.actions.delete.aria': 'Удалить {kind} {name}',
  'list.actions.edit.aria': 'Редактировать компонент {name}',
  'list.delete.confirmInline': 'Окончательно удалить {what}?',

  'modal.ok': 'OK',
  'modal.delete.title': 'Удаление',
  'modal.delete.blocked': 'Компонент {name} присутствует в BOM {bom}. Сначала удалите BOM.',
  'modal.delete.confirm': 'Подтвердите окончательное удаление {what}?',

  // EOQ
  'eoq.annualDemandLabel': 'Годовой спрос (готовый продукт)',
  'eoq.col.name': 'Название',
  'eoq.col.annualDemand': 'Годовой спрос',
  'eoq.col.unitCost': 'Себестоимость',
  'eoq.col.orderingCost': 'Издержки заказа',
  'eoq.col.carryingCost': 'Издержки хранения',
  'eoq.col.eoq': 'EOQ',
  'eoq.col.ordersPerYear': 'Заказов/год',
  'eoq.col.timeBetween': 'Интервал между заказами',
  'eoq.instructions': 'Выберите папку и BOM, затем введите годовой спрос.',
  'eoq.placeholder.annualDemand': 'например: 3000',
  'eoq.note.workingDays': 'В расчётах принято 200 рабочих дней в году.',

  // MRP
  'mrp.orders.count': 'Кол-во заказов',
  'mrp.btn.useAlpha': 'Пример Alpha',
  'mrp.btn.useSkate': 'Пример Skate',
  'mrp.btn.compute': 'Рассчитать MRP',
  'mrp.btn.export': 'Экспорт Excel',
  'mrp.export.title': 'Экспорт таблиц MRP в Excel',
  'mrp.export.disabled': 'Сначала рассчитайте MRP',
  'mrp.order.order': 'Заказ #',
  'mrp.order.t': 't =',
  'mrp.order.offset': 'Смещение (недели ранее)',
  'mrp.order.offset.aria': 'Смещение для заказа {index} (недели ранее)',
  'mrp.order.demand': 'Спрос',
  'mrp.metric': 'Показатель',
  'mrp.rows.gross': 'Валовые потребности',
  'mrp.rows.scheduled': 'Плановые поступления',
  'mrp.rows.onHand': 'Прогнозируемый остаток',
  'mrp.rows.net': 'Чистые потребности',
  'mrp.rows.por': 'План получ. заказа',
  'mrp.rows.pol': 'План выпусков',
  'mrp.rows.orderingCost': 'Издержки заказа',
  'mrp.rows.carryingCost': 'Издержки хранения',
  'mrp.rows.cost': 'Стоимость',
  'mrp.rows.cumulated': 'Накопленные издержки',

  // About
  'about.title': 'О проекте',
  'about.kicker': 'Flow — простое и наглядное приложение для обучения и сопровождения управления цепями поставок.',
  'about.author.title': 'Автор',
  'about.author.html': 'Меня зовут <strong>Лоик Мариньи</strong>. Я студент последнего курса инженерной школы (специализация: Энергетика и устойчивые города) в <a href="https://esilv.fr">ESILV</a>. Мне интересны разработка ПО, литература и политика. Найти меня можно внизу страницы в социальных сетях. По вопросам подготовки текстов или разработки решений пишите на <a href="mailto:loic.marigny.contact@gmail.com">loic.marigny.contact@gmail.com</a>.',
  'about.flow.title': 'Flow',
  'about.flow.origin.title': 'Происхождение проекта',
  'about.flow.origin.html': 'Этот проект создан в рамках курса по Supply Chain на четвёртом году обучения по направлению EVD в ESILV. Цель — реализовать программу, рассчитывающую экономичный размер заказа (EOQ) и планирование потребностей в материалах (MRP) для выпускаемого продукта.',
  'about.flow.how.title': 'Как работает приложение',
  'about.flow.how.html': 'Сначала, во вкладке «Конструктор BOM», пользователь создаёт карточки для всех компонентов изделия. Затем он может выстроить их в виде дерева, чтобы сформировать BOM в правой части экрана. После сохранения BOM можно перейти во вкладку EOQ для расчёта экономичного размера заказа и во вкладку MRP для расчёта потребностей. Готовые таблицы можно экспортировать в Excel. Понятия <strong>BOM</strong>, <strong>EOQ</strong>, <strong>MRP</strong>, а также используемые атрибуты компонентов описаны в разделе «Курс».',
  'about.flow.code.title': 'Код',
  'about.flow.code.html': 'Исходный код приложения доступен в репозитории GitHub: <a href="https://github.com/loic-marigny/flow-supply-chain">https://github.com/loic-marigny/flow-supply-chain</a>.',
  'about.course.title': 'Курс',
  'about.course.intro': 'Решение основано на темах курса по Supply Chain (4-й курс ESILV).',
  'about.chip.bom': 'BOM',
  'about.chip.bom.html': 'Bill of Materials: спецификация продукта в виде дерева, показывающая состав готового изделия. Готовый продукт находится в верхней части (родитель), а компоненты — ниже (дети).',
  'about.chip.eoq': 'EOQ',
  'about.chip.eoq.html': 'Economic Order Quantity: оптимальный размер заказа для минимизации издержек. Формула <strong>EOQ = <span class="sq2"><span class="fraction"><span class="num">2DS</span><span class="den">H</span></span></span></strong>, где D — годовой спрос, S — издержки заказа, H — годовые издержки хранения единицы.',
  'about.chip.mrp': 'MRP',
  'about.chip.mrp.html': 'Material Requirements Planning: планирование потребностей в материалах. Для каждого компонента формируется таблица потребностей, поступлений, остатков по периодам. В этом проекте дополнительно ведётся накопительная стоимость.',
  'about.chip.leadTime': 'Lead Time',
  'about.chip.leadTime.desc': 'Время получения продукта/услуги: от заказа до получения, включая транспорт и/или производство родительского компонента.',
  'about.chip.unitCost': 'Себестоимость',
  'about.chip.unitCost.desc': 'Стоимость единицы компонента при заказе, без учёта сборов и доставки.',
  'about.chip.carryingCost': 'Издержки хранения',
  'about.chip.carryingCost.desc': 'Издержки, связанные с наличием запасов. В таблицах учитываются по периодам (день, неделя и т.п.).',
  'about.chip.orderingCost': 'Издержки заказа',
  'about.chip.orderingCost.desc': 'Издержки, связанные с оформлением заказа (доставка, админ. расходы), не включая цену компонентов.',
  'about.chip.lotSize': 'Размер партии',
  'about.chip.lotSize.desc': 'Размер производимой/заказываемой партии.',
  'about.sources.title': 'Источники и литература',
  'about.sources.item1': 'Курс «Supply Chain Management», ESILV, 4-й курс.',
  'about.sources.item2.html': '<a href="https://rudyct.com/supchn/Operations%20Management%20Sustainability%20and%20Supply%20Chain%20Management-12E-2017.pdf">Operations Management: Sustainability and Supply Chain Management</a> (Jay Heizer, Barry Render, Chuck Munson)',
  'about.sources.item3.html': '<a href="https://bibliotheque.tbs-education.fr/Default/doc/SYRACUSE/36357/management-industriel-et-logistique-concevoir-et-piloter-la-supply-chain-gerard-baglin-olivier-bruel?_lg=fr-FR">Management Industriel et Logistique</a> (Gérard Baglin, Olivier Bruel, Laoucine Kerbache, Joseph Nehme, Christian van Delft)',

  // Node badge/buttons
  'node.quantity': 'Количество',
  'node.badge.edit.title': 'Нажмите, чтобы изменить',
  'node.badge.edit.aria': 'Количество: {count}. Нажмите Enter, чтобы изменить.',
  'node.minus.aria': 'Уменьшить количество',
  'node.minus.title': 'Уменьшить',
  'node.plus.aria': 'Увеличить количество',
  'node.plus.title': 'Увеличить',
};
