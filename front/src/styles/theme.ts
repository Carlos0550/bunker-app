import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

// Paleta de colores Rojo personalizada
const red: MantineColorsTuple = [
  '#ffe9e9',
  '#ffd1d1',
  '#fba0a1',
  '#f76d6d',
  '#f34141',
  '#f22625',
  '#f21616',
  '#d8080c',
  '#c10008',
  '#a90003',
];

// Paleta de grises simple (de blanco a negro)
const dark: MantineColorsTuple = [
  '#ffffff',  // Blanco puro
  '#f5f5f5',
  '#e0e0e0',
  '#c0c0c0',
  '#a0a0a0',
  '#808080',
  '#606060',
  '#404040',
  '#202020',
  '#000000',  // Negro puro
];

// Paleta alternativa de grises
const black: MantineColorsTuple = [
  '#ffffff',
  '#f0f0f0',
  '#d0d0d0',
  '#b0b0b0',
  '#909090',
  '#707070',
  '#505050',
  '#303030',
  '#101010',
  '#000000',
];

export const theme = createTheme({
  // Color primario: Rojo
  primaryColor: 'red',
  
  // Colores personalizados
  colors: {
    red,
    dark,
    black,
  },

  // Colores de fondo para dark mode
  other: {
    bodyBg: dark[9],
    paperBg: dark[9],
  },

  // Color de fondo por defecto
  defaultRadius: 'md',
  
  // Fuente
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },

  // Espaciado
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // Radios de bordes
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Sombras
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px',
    md: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    lg: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 28px 23px -7px, rgba(0, 0, 0, 0.04) 0px 12px 12px -7px',
    xl: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 36px 28px -7px, rgba(0, 0, 0, 0.04) 0px 17px 17px -7px',
  },

  // Configuración de componentes
  components: {
    Button: {
      defaultProps: {
        color: 'red',
      },
    },
    Badge: {
      defaultProps: {
        color: 'red',
      },
    },
    ActionIcon: {
      defaultProps: {
        color: 'red',
      },
    },
    Tabs: {
      defaultProps: {
        color: 'red',
      },
    },
    NavLink: {
      defaultProps: {
        color: 'red',
      },
    },
    ThemeIcon: {
      defaultProps: {
        color: 'red',
      },
    },
    Checkbox: {
      defaultProps: {
        color: 'red',
      },
    },
    Radio: {
      defaultProps: {
        color: 'red',
      },
    },
    Switch: {
      defaultProps: {
        color: 'red',
      },
    },
    Loader: {
      defaultProps: {
        color: 'red',
      },
    },
    Progress: {
      defaultProps: {
        color: 'red',
      },
    },
    Slider: {
      defaultProps: {
        color: 'red',
      },
    },
    Stepper: {
      defaultProps: {
        color: 'red',
      },
    },
    Anchor: {
      defaultProps: {
        c: 'red',
      },
      styles: {
        root: {
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    Menu: {
      defaultProps: {
        shadow: 'md',
      },
      styles: {
        dropdown: {
          backgroundColor: dark[0],
          color: dark[9],
          border: `1px solid ${red[5]}`,
        },
        item: {
          color: dark[9],
          '&:hover': {
            backgroundColor: red[0],
          },
        },
      },
    },
    Burger: {
      defaultProps: {
        color: dark[9],
      },
    },
    TextInput: {
      defaultProps: {
        variant: 'filled',
      },
      styles: {
        input: {
          backgroundColor: dark[1],
          borderColor: red[5],
          color: dark[9],
          '&:focus': {
            borderColor: red[5],
          },
        },
        label: {
          color: dark[9],
        },
      },
    },
    PasswordInput: {
      defaultProps: {
        variant: 'filled',
      },
      styles: {
        input: {
          backgroundColor: dark[1],
          borderColor: red[5],
          color: dark[9],
          '&:focus': {
            borderColor: red[5],
          },
        },
        label: {
          color: dark[9],
        },
      },
    },
    Paper: {
      defaultProps: {
        bg: dark[0],
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: red[5],
        },
      },
    },
    Table: {
      styles: {
        root: {
          color: dark[9],
        },
        thead: {
          '& tr th': {
            color: dark[7],
            borderBottomColor: red[5],
          },
        },
        tbody: {
          '& tr': {
            '&:hover': {
              backgroundColor: red[0],
            },
          },
          '& tr[data-striped="true"]': {
            backgroundColor: red[0],
          },
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: dark[0],
        },
      },
    },
  },
});

