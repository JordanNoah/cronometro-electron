const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron');
const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

let mainWindow;
let tray = null;
let horas = 0;
let minutos = 0;
let segundos = 0;
let intervalo;
let enPausa = false;


//modelo
const sequelize = new Sequelize('marcacion', 'root', '2352169', {
  host: 'localhost',
  dialect: 'mysql'
});

const Cronometro = sequelize.define('Cronometro', {
  horas: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  minutos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  segundos: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  tableName: 'cronometro'
});


sequelize.authenticate()
  .then(async() => {
    await Cronometro.sync(); // Sincronizar el modelo con la base de datos
    
    let cronometro = await crearCronometro();
    console.log(cronometro);
    
  })
  .catch(err => {
    const notification = new Notification({
      icon: path.join(__dirname, 'icono.png'), // Ícono de la notificación
      title: '¡Día completado!',
      body: err
    });
  
    notification.show();
  });

  async function crearCronometro(){
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [cronometro,created] = await Cronometro.findOrCreate({
        where: { 
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        defaults: {
          horas: 0,
          minutos: 0,
          segundos: 0
        }
      });
      return cronometro;
    } catch (err) {
      console.error('Error al crear el cronómetro:', err);
    }
  }

  function actuazliarCronometro(){}

// Función para guardar el estado del cronómetro en la base de datos
async function guardarCronometro() {
  try {
    await Cronometro.create({
      horas: horas,
      minutos: minutos,
      segundos: segundos
    });
    console.log('Estado del cronómetro guardado correctamente');
  } catch (err) {
    console.error('Error al guardar el cronómetro:', err);
  }
}

setInterval(() => {
  guardarCronometro().catch(err => console.error('Error guardando datos:', err));
}, 600000);  // Guardar cada 10 minuto, por ejemplo