import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translations
const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success!',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit'
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        email: 'Email',
        password: 'Password'
      },
      bookings: {
        create: 'Create Booking',
        confirm: 'Confirm Booking',
        cancel: 'Cancel Booking',
        date: 'Date',
        time: 'Time',
        service: 'Service'
      }
    }
  },
  es: {
    translation: {
      common: {
        loading: 'Cargando...',
        error: 'Se produjo un error',
        success: '¡Éxito!',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar'
      },
      auth: {
        signIn: 'Iniciar Sesión',
        signUp: 'Registrarse',
        signOut: 'Cerrar Sesión',
        email: 'Correo electrónico',
        password: 'Contraseña'
      },
      bookings: {
        create: 'Crear Reserva',
        confirm: 'Confirmar Reserva',
        cancel: 'Cancelar Reserva',
        date: 'Fecha',
        time: 'Hora',
        service: 'Servicio'
      }
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;