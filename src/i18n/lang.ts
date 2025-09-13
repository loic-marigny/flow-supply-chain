export type Lang = 'en' | 'fr';

type Dict = Record<string, string>;

export const en: Dict = {
  // Navbar / Auth
  'nav.bom': 'BOM Builder',
  'nav.eoq': 'Economic Order Quantity (EOQ)',
  'nav.mrp': 'Material Requirements Planning (MRP)',
  'nav.about': 'About',
  'auth.login': 'Login',
  'auth.logout': 'Logout',
  // Auth errors
  'auth.error.unknown': 'Unknown error',
  'auth.error.google': 'Google sign-in error',
  'auth.error.passwordPolicy': 'Password must be at least 8 characters, include one lowercase, one uppercase and one special character.',

  // Common
  'loading': 'Loading…',

  // Folders
  'folders.title': 'My folders',
  'folders.new.placeholder': 'New folder',
  'folders.new.create': 'Create',
  'folders.rename.save': 'Save',
  'folders.rename.cancel': 'Cancel',
  'folders.rename.placeholder': 'Folder name',
  'folders.actions.rename': 'Rename',
  'folders.actions.delete': 'Delete',
  'folders.delete.confirm': 'Delete folder "{name}"? This will also delete its components and BOMs.',

  // Component form
  'form.section.add': 'Add a component',
  'form.section.edit': 'Edit component',
  'form.folder': 'Folder',
  'form.name': 'Name',
  'form.add': 'Add',
  'form.save': 'Save',
  // Placeholders for ComponentForm
  'form.placeholder.leadTime': 'Lead Time',
  'form.placeholder.onHand': 'On-hand Quantity',
  'form.placeholder.lotSize': 'Lot Size',
  'form.placeholder.unitCost': 'Unit Cost',
  'form.placeholder.orderingCost': 'Ordering Cost',
  'form.placeholder.carryingCost': 'Carrying Cost',

  // Save BOM modal
  'modal.saveBom.title': 'Save the BOM',
  'modal.saveBom.chooseFolder': 'Which folder to save the BOM to?',
  'modal.saveBom.bomName': 'BOM name',
  'modal.saveBom.selectFolder': 'Select a folder',
  'modal.cancel': 'Cancel',
  'modal.confirm': 'Save',

  // Import BOM modal
  'modal.importBom.title': 'Import this BOM',
  'modal.importBom.question': 'What do you want to do with the current canvas?',
  'modal.importBom.add': 'Add',
  'modal.importBom.replace': 'Replace',

  // Canvas
  'canvas.save': 'Save BOM',
  'split.resizeHint': 'Drag to resize',

  // Toasts
  'toast.bom.invalid': 'Invalid BOM',
  'toast.bom.missingRoot': 'BOM not found (no root)',
  'toast.bom.saved': 'BOM saved successfully!',
  'toast.bom.saveError': 'Error while saving the BOM.',
  'toast.folders.loadError': 'Unable to load folders',

  // Component list and deletion
  'list.bom': 'BOM',
  'list.component': 'component',
  'list.what.bom': 'this BOM {name}',
  'list.what.component': 'this component {name}',
  'list.actions.delete': 'Delete',
  'list.actions.edit': 'Edit',
  'list.actions.delete.aria': 'Delete {kind} {name}',
  'list.actions.edit.aria': 'Edit component {name}',
  'list.delete.confirmInline': 'Permanently delete {what}?',

  // Component node (badge and controls)
  'node.quantity': 'Quantity',
  'node.badge.edit.title': 'Click to edit',
  'node.badge.edit.aria': 'Quantity: {count}. Press Enter to edit.',
  'node.minus.aria': 'Decrease quantity',
  'node.minus.title': 'Decrease',
  'node.plus.aria': 'Increase quantity',
  'node.plus.title': 'Increase',

  'modal.ok': 'OK',
  'modal.delete.title': 'Delete',
  'modal.delete.blocked': 'The component {name} is present in the BOM {bom}. Please delete the BOM first.',
  'modal.delete.confirm': 'Do you confirm permanently deleting {what}?',

  // EOQ
  'eoq.annualDemandLabel': 'Annual Demand (final product)',
  'eoq.col.name': 'Name',
  'eoq.col.annualDemand': 'Annual Demand',
  'eoq.col.unitCost': 'Unit cost',
  'eoq.col.orderingCost': 'Ordering cost',
  'eoq.col.carryingCost': 'Carrying cost',
  'eoq.col.eoq': 'EOQ',
  'eoq.col.ordersPerYear': '# Orders/Year',
  'eoq.col.timeBetween': 'Time between orders',
  'eoq.placeholder.annualDemand': 'ex: 3000',
  'eoq.instructions': 'Select a folder and a BOM, then enter the annual demand.',

  // MRP
  'mrp.orders.count': '# Orders',
  'mrp.btn.useAlpha': 'Use Alpha Orders',
  'mrp.btn.useSkate': 'Use Skate Orders',
  'mrp.btn.compute': 'Compute MRP',
  'mrp.btn.export': 'Export Excel',
  'mrp.export.title': 'Export MRP tables to Excel',
  'mrp.export.disabled': 'Compute MRP first',
  'mrp.order.order': 'Order #',
  'mrp.order.t': 't =',
  'mrp.order.offset': 'Offset (weeks earlier)',
  'mrp.order.offset.aria': 'Offset for order {index} (weeks earlier)',
  'mrp.order.demand': 'Demand',
  'mrp.metric': 'Metric',
  'mrp.rows.gross': 'Gross Requirements',
  'mrp.rows.scheduled': 'Scheduled Receipts',
  'mrp.rows.onHand': 'Projected On Hand',
  'mrp.rows.net': 'Net Requirements',
  'mrp.rows.por': 'Planned Order Receipt',
  'mrp.rows.pol': 'Planned Order Releases',
  'mrp.rows.orderingCost': 'Ordering Cost',
  'mrp.rows.carryingCost': 'Carrying Cost',
  'mrp.rows.cost': 'Cost',
  'mrp.rows.cumulated': 'Cumulated Costs',
  'mrp.instructions': 'Enter a schedule of orders then click "Compute MRP".',
  
  // About
  'about.title': 'About',
  'about.kicker': "Flow is a simple, visual solution to teach and track supply chain management.",
  'about.author.title': 'The Author',
  'about.author.html': 'My name is <strong>Loïc Marigny</strong>. I am a final-year generalist engineering student, specialized in Energy and Sustainable Cities, at <a href="https://esilv.fr">ESILV</a>. I am passionate about software development, literature and politics. You can find me on my social networks at the bottom of the page. For any writing or software development request, you can also contact me at <a href="mailto:loic.marigny.contact@gmail.com">loic.marigny.contact@gmail.com</a>.',
  'about.flow.title': 'Flow',
  'about.flow.origin.title': 'Project Origin',
  'about.flow.origin.html': "This project was written as part of a Supply Chain course taught in the fourth year of the EVD major at ESILV. The goal was to create a program that computes the Economic Order Quantity (EOQ) and the Material Requirements Planning (MRP) of a manufactured product.",
  'about.flow.how.title': 'How the application works',
  'about.flow.how.html': 'First, in the “BOM Builder” tab, the user creates cards for all product components. Then, they can arrange them as a tree to build a BOM on the right side of the screen. Once the BOM is saved, the user can go to the Economic Order Quantity tab to compute EOQ and to the Material Requirements Planning tab to compute MRP. Once computed, it can also be exported to Excel. The notions of <strong>BOM</strong>, <strong>EOQ</strong>, <strong>MRP</strong> and the component data used here are explained in the “Course” section.',
  'about.flow.code.title': 'Source Code',
  'about.flow.code.html': 'The source code of this application is available on GitHub at <a href="https://github.com/loic-marigny/flow-supply-chain">https://github.com/loic-marigny/flow-supply-chain</a>.',
  'about.course.title': 'The Course',
  'about.course.intro': 'This application was created based on concepts from the Supply Chain course taught in the fourth year at ESILV.',
  'about.chip.bom': 'BOM',
  'about.chip.bom.html': 'Bill of Materials: The BOM, represented as a tree, is a diagram that shows how a finished product is composed. The finished product appears at the top of the tree (the "parent"), and the components are shown underneath (the "children").',
  'about.chip.eoq': 'EOQ',
  'about.chip.eoq.html': 'Economic Order Quantity: EOQ is the optimal order quantity to minimize costs. It is computed with <strong>EOQ = <span class="sq2"><span class="fraction"><span class="num">2DS</span><span class="den">H</span></span></span></strong>, where D is annual demand, S is ordering cost, and H is the annual per-unit holding cost.',
  'about.chip.mrp': 'MRP',
  'about.chip.mrp.html': 'Material Requirements Planning: MRP formalizes material planning. It includes a table per component that shows order quantities, receipts and on-hand stock for each period. Here, we also chose to track costs along the way, which is not always standard.',
  'about.chip.leadTime': 'Lead Time',
  'about.chip.leadTime.desc': 'Time required to obtain a product or a service. It may be the time between ordering and receiving, transportation between sites, or the manufacturing time of a parent component inside the factory. Often a mix of the three.',
  'about.chip.unitCost': 'Unit Cost',
  'about.chip.unitCost.desc': 'Unit price of a component when ordered, excluding fees and delivery.',
  'about.chip.carryingCost': 'Carrying Cost',
  'about.chip.carryingCost.desc': 'Costs related to holding inventory. In our tables, they are considered per period: if you consider periods as days, this is a daily cost; if weeks, a weekly cost.',
  'about.chip.orderingCost': 'Ordering Cost',
  'about.chip.orderingCost.desc': 'Costs associated with placing an order such as shipping and administrative processing (excluding component prices).',
  'about.chip.lotSize': 'Lot Size',
  'about.chip.lotSize.desc': 'Size of manufactured or purchased lots.',
  'about.sources.title': 'Sources & Bibliography',
  'about.sources.item1': '"Supply Chain Management" course taught at ESILV (4th year).',
  'about.sources.item2.html': '<a href="https://rudyct.com/supchn/Operations%20Management%20Sustainability%20and%20Supply%20Chain%20Management-12E-2017.pdf">Operations Management: Sustainability and Supply Chain Management</a> (Jay Heizer, Barry Render, Chuck Munson)',
  'about.sources.item3.html': '<a href="https://bibliotheque.tbs-education.fr/Default/doc/SYRACUSE/36357/management-industriel-et-logistique-concevoir-et-piloter-la-supply-chain-gerard-baglin-olivier-bruel?_lg=fr-FR">Management Industriel et Logistique</a> (Gérard Baglin, Olivier Bruel, Laoucine Kerbache, Joseph Nehme, Christian van Delft)',

  // Login page
  'login.title.signIn': 'Login',
  'login.title.signUp': 'Create an account',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.password.policy': 'At least 8 chars, including one lowercase, one uppercase and one special character.',
  'login.btn.signIn': 'Sign in',
  'login.btn.signUp': 'Create my account',
  'login.btn.google': 'Sign in with Google',
  'login.toggle.toSignIn': 'I already have an account',
  'login.toggle.toSignUp': 'Create an account',

  // Complete profile
  'profile.title': 'Complete your profile',
  'profile.firstName': 'First name',
  'profile.lastName': 'Last name',
  'profile.btn.save': 'Save',
  'profile.error.missing': 'Please fill in all fields.',
  'profile.error.save': 'Error while saving.',
  'eoq.note.workingDays': 'This software assumes 200 working days per year. We assume the user has entered the Carrying Cost in days.',
};

export const fr: Dict = {
  // Navbar / Auth
  'nav.bom': 'Gestion du BOM',
  'nav.eoq': 'Economic Order Quantity (EOQ)',
  'nav.mrp': 'Material Requirements Planning (MRP)',
  'nav.about': 'À propos',
  'auth.login': 'Connexion',
  'auth.logout': 'Déconnexion',
  // Auth errors
  'auth.error.unknown': 'Erreur inconnue',
  'auth.error.google': 'Erreur Google',
  'auth.error.passwordPolicy': 'Le mot de passe doit faire au moins 8 caractères et contenir au moins une minuscule, une majuscule et un caractère spécial.',

  // Common
  'loading': 'Chargement…',

  // Folders
  'folders.title': 'Mes dossiers',
  'folders.new.placeholder': 'Nouveau dossier',
  'folders.new.create': 'Créer',
  'folders.rename.save': 'Enregistrer',
  'folders.rename.cancel': 'Annuler',
  'folders.rename.placeholder': 'Nom du dossier',
  'folders.actions.rename': 'Renommer',
  'folders.actions.delete': 'Supprimer',
  'folders.delete.confirm': 'Supprimer le dossier "{name}" ? Cela supprimera aussi ses composants et BOMs.',

  // Component form
  'form.section.add': 'Ajouter un composant',
  'form.section.edit': 'Modifier le composant',
  'form.folder': 'Dossier',
  'form.name': 'Nom',
  'form.add': 'Ajouter',
  'form.save': 'Sauvegarder',
  // Placeholders for ComponentForm
  'form.placeholder.leadTime': 'Lead Time',
  'form.placeholder.onHand': 'Quantité en stock',
  'form.placeholder.lotSize': 'Taille de lot',
  'form.placeholder.unitCost': 'Coût unitaire',
  'form.placeholder.orderingCost': 'Coût de commande',
  'form.placeholder.carryingCost': 'Coût de possession',

  // Save BOM modal
  'modal.saveBom.title': 'Enregistrer le BOM',
  'modal.saveBom.chooseFolder': 'Dans quel dossier enregistrer le BOM ?',
  'modal.saveBom.bomName': 'Nom du BOM',
  'modal.saveBom.selectFolder': 'Sélectionner un dossier',
  'modal.cancel': 'Annuler',
  'modal.confirm': 'Enregistrer',
  // Login page
  'login.title.signIn': 'Connexion',
  'login.title.signUp': 'Créer un compte',
  'login.email': 'Email',
  'login.password': 'Mot de passe',
  'login.password.policy': 'Au moins 8 caractères, avec une minuscule, une majuscule et un caractère spécial.',
  'login.btn.signIn': 'Se connecter',
  'login.btn.signUp': 'Créer mon compte',
  'login.btn.google': 'Connexion avec Google',
  'login.toggle.toSignIn': "J'ai déjà un compte",
  'login.toggle.toSignUp': 'Créer un compte',

  // Complete profile
  'profile.title': 'Complète ton profil',
  'profile.firstName': 'Prénom',
  'profile.lastName': 'Nom',
  'profile.btn.save': 'Enregistrer',
  'profile.error.missing': 'Merci de remplir tous les champs.',
  'profile.error.save': 'Erreur lors de l\'enregistrement.',
  'eoq.note.workingDays': 'Ce logiciel prévoit 200 jours ouvrés par an. Nous partons du principe que l\'utilisateur a entré le Carrying Cost en jours.',

  // Import BOM modal
  'modal.importBom.title': 'Importer ce BOM',
  'modal.importBom.question': 'Que souhaitez-vous faire avec le canvas actuel ?',
  'modal.importBom.add': 'Ajouter',
  'modal.importBom.replace': 'Remplacer',

  // Canvas
  'canvas.save': 'Enregistrer le BOM',
  'split.resizeHint': 'Glisser pour redimensionner',

  // Toasts
  'toast.bom.invalid': 'BOM invalide',
  'toast.bom.missingRoot': 'BOM introuvable (pas de racine)',
  'toast.bom.saved': 'BOM enregistré avec succès !',
  'toast.bom.saveError': "Erreur lors de l'enregistrement du BOM.",
  'toast.folders.loadError': 'Impossible de charger les dossiers',

  // Component list and deletion
  'list.bom': 'BOM',
  'list.component': 'composant',
  'list.what.bom': 'ce BOM {name}',
  'list.what.component': 'ce composant {name}',
  'list.actions.delete': 'Supprimer',
  'list.actions.edit': 'Modifier',
  'list.actions.delete.aria': 'Supprimer {kind} {name}',
  'list.actions.edit.aria': 'Modifier le composant {name}',
  'list.delete.confirmInline': 'Supprimer définitivement {what} ?',

  // Composant (pastille et boutons)
  'node.quantity': 'Quantité',
  'node.badge.edit.title': 'Cliquez pour modifier',
  'node.badge.edit.aria': 'Quantité : {count}. Appuyez sur Entrée pour modifier.',
  'node.minus.aria': 'Diminuer la quantité',
  'node.minus.title': 'Diminuer',
  'node.plus.aria': 'Augmenter la quantité',
  'node.plus.title': 'Augmenter',

  'modal.ok': 'OK',
  'modal.delete.title': 'Supprimer',
  'modal.delete.blocked': "Le composant {name} est présent dans le BOM {bom}. Veuillez supprimer le BOM d'abord.",
  'modal.delete.confirm': 'Confirmez-vous la suppression définitive de {what} ?',

  // EOQ
  'eoq.annualDemandLabel': 'Demande annuelle (produit fini)',
  'eoq.col.name': 'Nom',
  'eoq.col.annualDemand': 'Demande annuelle',
  'eoq.col.unitCost': 'Coût unitaire',
  'eoq.col.orderingCost': 'Coût de commande',
  'eoq.col.carryingCost': 'Coût de possession',
  'eoq.col.eoq': 'EOQ',
  'eoq.col.ordersPerYear': '# Commandes/an',
  'eoq.col.timeBetween': 'Temps entre commandes',
  'eoq.placeholder.annualDemand': 'ex : 3000',
  'eoq.instructions': 'Sélectionnez un dossier et un BOM, puis indiquez la demande annuelle.',

  // MRP
  'mrp.orders.count': '# Commandes',
  'mrp.btn.useAlpha': 'Utiliser les commandes Alpha',
  'mrp.btn.useSkate': 'Utiliser les commandes Skate',
  'mrp.btn.compute': 'Calculer le MRP',
  'mrp.btn.export': 'Exporter Excel',
  'mrp.export.title': 'Exporter les tableaux MRP en Excel',
  'mrp.export.disabled': "Calcule d'abord le MRP",
  'mrp.order.order': 'Commande #',
  'mrp.order.t': 't =',
  'mrp.order.offset': 'Décalage (semaines en amont)',
  'mrp.order.offset.aria': "Décalage pour la commande {index} (semaines en amont)",
  'mrp.order.demand': 'Demande',
  'mrp.metric': 'Mesure',
  'mrp.rows.gross': 'Besoins bruts',
  'mrp.rows.scheduled': 'Réceptions planifiées',
  'mrp.rows.onHand': 'Stock projeté',
  'mrp.rows.net': 'Besoins nets',
  'mrp.rows.por': "Réception de commande planifiée",
  'mrp.rows.pol': "Lancements de commande planifiés",
  'mrp.rows.orderingCost': 'Coût de commande',
  'mrp.rows.carryingCost': 'Coût de possession',
  'mrp.rows.cost': 'Coût',
  'mrp.rows.cumulated': 'Coûts cumulés',
  'mrp.instructions': "Saisissez un planning de commandes puis cliquez \"Calculer le MRP\".",
  
  // About
  'about.title': 'À propos',
  'about.kicker': "Flow est une solution simple et visuelle pour enseigner et suivre la gestion d'une supply chain.",
  'about.author.title': "L'auteur",
  'about.author.html': "Je m'appelle <strong>Loïc Marigny</strong>. Je suis étudiant en dernière année d'école d'ingénieur généraliste, spécialisé en Énergies et Villes Durables, à l'<a href=\"https://esilv.fr\">ESILV</a>. Je suis passionné de développement, de littérature et de politique. Vous pouvez me retrouver sur mes différents réseaux sociaux en bas de page. Pour toute demande de rédaction de note, rapport ou développement de solution informatique, vous pouvez également me contacter à l'adresse <a href=\"mailto:loic.marigny.contact@gmail.com\">loic.marigny.contact@gmail.com</a>.",
  'about.flow.title': 'Flow',
  'about.flow.origin.title': 'Origine du projet',
  'about.flow.origin.html': "Ce projet a été rédigé dans le cadre d'un cours de Supply Chain, enseigné en quatrième année de la majeure EVD à l'ESILV. Le sujet était de créer un programme permettant de calculer l'Economic Order Quantity (EOQ) et le Material Requirements Planning (MRP) d'un objet produit.",
  'about.flow.how.title': "Le fonctionnement de l'application",
  'about.flow.how.html': "Dans un premier temps, dans l'onglet \"Gestion du BOM\", l'utilisateur crée des cartes pour tous les composants du produit. Ensuite, il peut les formaliser sous forme d'arbre pour créer un BOM dans la partie droite de l'écran. Une fois le BOM enregistré, l'utilisateur peut se rendre dans l'onglet Economic Order Quantity pour calculer l'EOQ, et dans l'onglet Material Requirements Planning pour calculer le MRP. Une fois calculé, il est également possible de l'exporter au format Excel. Les notions de <strong>BOM</strong>, <strong>EOQ</strong>, <strong>MRP</strong> et les données des composants telles qu'utilisées ici sont expliquées dans la section \"Le cours\".",
  'about.flow.code.title': 'Le code',
  'about.flow.code.html': 'Le code de cette application est disponible dans un dépôt GitHub à l\'adresse <a href="https://github.com/loic-marigny/flow-supply-chain">https://github.com/loic-marigny/flow-supply-chain</a>.',
  'about.course.title': 'Le cours',
  'about.course.intro': "Cette solution a été réalisée sur la base des notions du cours de Supply Chain enseigné en quatrième année à l'ESILV.",
  'about.chip.bom': 'BOM',
  'about.chip.bom.html': 'Bill of Materials : Le BOM, formalisé sous forme d’arbre, est un graphique indiquant comment se compose un produit fini. Le produit fini apparaît tout en haut de l’arbre (il est dit “parent”) et les composants sont représentés en dessous (ils sont dits “enfants”).',
  'about.chip.eoq': 'EOQ',
  'about.chip.eoq.html': "Economic Order Quantity : L'EOQ est la quantité optimale à commander pour minimiser les coûts. Il est calculé avec la formule <strong>EOQ = <span class=\"sq2\"><span class=\"fraction\"><span class=\"num\">2DS</span><span class=\"den\">H</span></span></span></strong>, où D est la demande annuelle, S est le coût de passation de commande et H est le coût de stockage unitaire annuel.",
  'about.chip.mrp': 'MRP',
  'about.chip.mrp.html': "Material Requirements Planning : Le MRP est une formalisation de la planification des besoins en matériaux. Il comporte un tableau par composant indiquant les quantités de commande, de réception et de stock pour chaque période. Ici, nous avons également fait le choix de suivre les coûts au fur et à mesure, ce qui n’est pas toujours d’usage.",
  'about.chip.leadTime': 'Lead Time',
  'about.chip.leadTime.desc': "Temps nécessaire pour obtenir un produit ou un service. Cela peut être le temps entre la commande d’un objet et sa réception, le temps de transport entre différents sites, ou le temps de fabrication d’un composant parent à l’intérieur de l’usine. C’est généralement un mix des trois.",
  'about.chip.unitCost': 'Coût unitaire',
  'about.chip.unitCost.desc': "Coût unitaire d’une pièce du composant à la commande, hors frais et livraison.",
  'about.chip.carryingCost': 'Coût de possession',
  'about.chip.carryingCost.desc': "Coûts liés à la possession de stocks. Dans nos tableaux, ils sont considérés par période : si vous considérez la période comme un jour, c’est un coût journalier ; si c’est une semaine, un coût hebdomadaire.",
  'about.chip.orderingCost': 'Coût de commande',
  'about.chip.orderingCost.desc': "Coûts liés au passage de commande (livraison, frais administratifs…), hors prix des composants.",
  'about.chip.lotSize': 'Taille de lot',
  'about.chip.lotSize.desc': 'Taille des lots fabriqués ou commandés.',
  'about.sources.title': 'Sources & bibliographie',
  'about.sources.item1': 'Cours “Supply Chain Management” dispensé à l’ESILV en quatrième année.',
  'about.sources.item2.html': '<a href="https://rudyct.com/supchn/Operations%20Management%20Sustainability%20and%20Supply%20Chain%20Management-12E-2017.pdf">Operations Management : Sustainability and Supply Chain Management</a> (Jay Heizer, Barry Render, Chuck Munson)',
  'about.sources.item3.html': '<a href="https://bibliotheque.tbs-education.fr/Default/doc/SYRACUSE/36357/management-industriel-et-logistique-concevoir-et-piloter-la-supply-chain-gerard-baglin-olivier-bruel?_lg=fr-FR">Management Industriel et Logistique</a> (Gérard Baglin, Olivier Bruel, Laoucine Kerbache, Joseph Nehme, Christian van Delft)',
};





