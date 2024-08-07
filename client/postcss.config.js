module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
  theme: {
    extend: {
      theme:{
        extend:{
          'screens': {
           'xs': '480px',
           'xxs': '320px'
        }
      }
    },
  },
},
};
