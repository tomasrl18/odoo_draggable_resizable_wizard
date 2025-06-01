{
    'name': 'Draggable-Resizable Wizard',
    'version': '15.0.1.0.0',
    'license': 'LGPL-3',
    'depends': ['base', 'web'],
    'author': 'Tomás Raigal',
    'maintainer': 'Tomás Raigal',
    'category': 'Extra Tools',
    'summary': 'Make wizard draggable and resizable',
    'description': """Make every wizard in the backend draggable and resizable. 
                      This allows users to adjust the wizard as per their needs.""",
    'assets': {
        'web.assets_backend': [
            'draggable_and_resizable_wizard/static/src/css/draggable.css',
            'draggable_and_resizable_wizard/static/src/js/draggable_wiz.js',
        ]
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'price': 4.99,
    'currency': 'EUR',
    'images': [
        'static/description/banner.png',
    ],
}
