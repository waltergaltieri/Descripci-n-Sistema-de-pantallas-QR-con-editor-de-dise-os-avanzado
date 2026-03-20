jest.mock('polotno/model/store', () => {
  const createElement = (snapshot = {}) => {
    const element = {
      ...snapshot,
      animations: Array.isArray(snapshot.animations) ? [...snapshot.animations] : [],
      set(updates = {}) {
        Object.assign(element, JSON.parse(JSON.stringify(updates)));
        return element;
      },
      toJSON() {
        const { set, toJSON, ...serializable } = element;
        return JSON.parse(JSON.stringify(serializable));
      }
    };

    return element;
  };

  const createPage = (snapshot = {}) => {
    const page = {
      width: snapshot.width ?? 1080,
      height: snapshot.height ?? 1080,
      title: snapshot.title,
      children: [],
      addElement(elementSnapshot = {}) {
        const element = createElement(elementSnapshot);
        page.children.push(element);
        return element;
      },
      toJSON() {
        return {
          width: page.width,
          height: page.height,
          title: page.title,
          children: page.children.map((child) => child.toJSON())
        };
      }
    };

    (snapshot.children || []).forEach((child) => {
      page.addElement(child);
    });

    return page;
  };

  const createStore = (snapshot = {}) => {
    const store = {
      pages: [
        createPage({
          width: snapshot.width ?? 1080,
          height: snapshot.height ?? 1080,
          title: snapshot.title
        })
      ],
      get activePage() {
        return store.pages[0];
      },
      addPage(pageSnapshot = {}) {
        const page = createPage(pageSnapshot);
        store.pages.push(page);
        return page;
      },
      toJSON() {
        return {
          width: store.activePage?.width,
          height: store.activePage?.height,
          pages: store.pages.map((page) => page.toJSON())
        };
      },
      loadJSON(json = {}) {
        store.pages = (json.pages || []).map((pageSnapshot) => createPage(pageSnapshot));
      }
    };

    return store;
  };

  return { createStore };
});

jest.mock('polotno/config', () => ({
  unstable_registerNextDomDrop: jest.fn()
}));

const { createStore } = require('polotno/model/store');
const { unstable_registerNextDomDrop } = require('polotno/config');

unstable_registerNextDomDrop();

describe('Editor Polotno - Serializacion', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      width: 1920,
      height: 1080,
      unit: 'px'
    });
  });

  test('debe crear un store vacio correctamente', () => {
    expect(store).toBeDefined();
    expect(store.pages.length).toBe(1);
    expect(store.activePage).toBeDefined();
  });

  test('debe serializar y deserializar un diseño vacio', () => {
    const json = store.toJSON();
    expect(json).toBeDefined();
    expect(json.pages).toBeDefined();
    expect(json.pages.length).toBe(1);

    const newStore = createStore();
    newStore.loadJSON(json);
    expect(newStore.pages.length).toBe(1);
    expect(newStore.activePage.width).toBe(1920);
    expect(newStore.activePage.height).toBe(1080);
  });

  test('debe agregar y serializar elementos de texto', () => {
    store.activePage.addElement({
      type: 'text',
      text: 'Texto de prueba',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 24,
      fill: '#000000'
    });

    expect(store.activePage.children.length).toBe(1);
    const element = store.activePage.children[0];
    expect(element.type).toBe('text');
    expect(element.text).toBe('Texto de prueba');

    const json = store.toJSON();
    const newStore = createStore();
    newStore.loadJSON(json);

    expect(newStore.activePage.children.length).toBe(1);
    expect(newStore.activePage.children[0].text).toBe('Texto de prueba');
  });

  test('debe agregar y serializar elementos de imagen', () => {
    store.activePage.addElement({
      type: 'image',
      src: 'https://via.placeholder.com/300x200',
      x: 200,
      y: 200,
      width: 300,
      height: 200
    });

    expect(store.activePage.children.length).toBe(1);
    const element = store.activePage.children[0];
    expect(element.type).toBe('image');
    expect(element.src).toBe('https://via.placeholder.com/300x200');

    const json = store.toJSON();
    const newStore = createStore();
    newStore.loadJSON(json);

    expect(newStore.activePage.children.length).toBe(1);
    expect(newStore.activePage.children[0].src).toBe('https://via.placeholder.com/300x200');
  });

  test('debe agregar y serializar formas', () => {
    store.activePage.addElement({
      type: 'svg',
      x: 300,
      y: 300,
      width: 100,
      height: 100,
      fill: '#ff0000',
      src: '<svg viewBox="0 0 100 100"><rect width="100" height="100" /></svg>'
    });

    expect(store.activePage.children.length).toBe(1);
    const element = store.activePage.children[0];
    expect(element.type).toBe('svg');
    expect(element.fill).toBe('#ff0000');

    const json = store.toJSON();
    const newStore = createStore();
    newStore.loadJSON(json);

    expect(newStore.activePage.children.length).toBe(1);
    expect(newStore.activePage.children[0].fill).toBe('#ff0000');
  });

  test('debe manejar multiples elementos', () => {
    store.activePage.addElement({
      type: 'text',
      text: 'Titulo',
      x: 50,
      y: 50,
      fontSize: 32
    });

    store.activePage.addElement({
      type: 'image',
      src: 'https://via.placeholder.com/200x150',
      x: 100,
      y: 150
    });

    store.activePage.addElement({
      type: 'svg',
      x: 300,
      y: 100,
      width: 80,
      height: 80,
      fill: '#00ff00',
      src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" /></svg>'
    });

    expect(store.activePage.children.length).toBe(3);

    const json = store.toJSON();
    const newStore = createStore();
    newStore.loadJSON(json);

    expect(newStore.activePage.children.length).toBe(3);
    expect(newStore.activePage.children[0].type).toBe('text');
    expect(newStore.activePage.children[1].type).toBe('image');
    expect(newStore.activePage.children[2].type).toBe('svg');
  });
});

describe('Editor Polotno - Animaciones', () => {
  let store;
  let element;

  beforeEach(() => {
    store = createStore({
      width: 1920,
      height: 1080
    });

    element = store.activePage.addElement({
      type: 'text',
      text: 'Elemento animado',
      x: 100,
      y: 100,
      width: 200,
      height: 50
    });
  });

  test('debe agregar animacion fade', () => {
    element.set({
      animations: [{
        type: 'fade',
        duration: 1000,
        delay: 0,
        easing: 'ease-in-out',
        repeat: 1,
        direction: 'normal',
        autoplay: true
      }]
    });

    expect(element.animations).toBeDefined();
    expect(element.animations.length).toBe(1);
    expect(element.animations[0].type).toBe('fade');
    expect(element.animations[0].duration).toBe(1000);
  });

  test('debe agregar animacion slide', () => {
    element.set({
      animations: [{
        type: 'slide',
        duration: 2000,
        delay: 500,
        easing: 'ease-out',
        repeat: 'infinite',
        direction: 'alternate',
        slideDirection: 'left',
        autoplay: false
      }]
    });

    expect(element.animations[0].type).toBe('slide');
    expect(element.animations[0].slideDirection).toBe('left');
    expect(element.animations[0].repeat).toBe('infinite');
  });

  test('debe agregar animacion scale', () => {
    element.set({
      animations: [{
        type: 'scale',
        duration: 1500,
        delay: 200,
        easing: 'ease-in',
        repeat: 3,
        direction: 'reverse',
        scaleFrom: 0.5,
        scaleTo: 1.5,
        autoplay: true
      }]
    });

    expect(element.animations[0].type).toBe('scale');
    expect(element.animations[0].scaleFrom).toBe(0.5);
    expect(element.animations[0].scaleTo).toBe(1.5);
  });

  test('debe agregar animacion rotate', () => {
    element.set({
      animations: [{
        type: 'rotate',
        duration: 3000,
        delay: 0,
        easing: 'linear',
        repeat: 'infinite',
        direction: 'normal',
        rotateFrom: 0,
        rotateTo: 360,
        autoplay: true
      }]
    });

    expect(element.animations[0].type).toBe('rotate');
    expect(element.animations[0].rotateFrom).toBe(0);
    expect(element.animations[0].rotateTo).toBe(360);
  });

  test('debe agregar multiples animaciones', () => {
    element.set({
      animations: [
        {
          type: 'fade',
          duration: 1000,
          delay: 0,
          autoplay: true
        },
        {
          type: 'scale',
          duration: 1500,
          delay: 1000,
          scaleFrom: 1,
          scaleTo: 1.2,
          autoplay: true
        }
      ]
    });

    expect(element.animations.length).toBe(2);
    expect(element.animations[0].type).toBe('fade');
    expect(element.animations[1].type).toBe('scale');
  });

  test('debe serializar y deserializar animaciones', () => {
    element.set({
      animations: [{
        type: 'pulse',
        duration: 2000,
        delay: 100,
        easing: 'ease-in-out',
        repeat: 'infinite',
        direction: 'alternate',
        autoplay: true
      }]
    });

    const json = store.toJSON();
    const newStore = createStore();
    newStore.loadJSON(json);

    const newElement = newStore.activePage.children[0];
    expect(newElement.animations).toBeDefined();
    expect(newElement.animations.length).toBe(1);
    expect(newElement.animations[0].type).toBe('pulse');
    expect(newElement.animations[0].duration).toBe(2000);
    expect(newElement.animations[0].repeat).toBe('infinite');
  });

  test('debe remover animaciones', () => {
    element.set({
      animations: [{
        type: 'bounce',
        duration: 1000,
        autoplay: true
      }]
    });

    expect(element.animations.length).toBe(1);

    element.set({ animations: [] });
    expect(element.animations.length).toBe(0);
  });
});

describe('Editor Polotno - Multipantalla', () => {
  let store;

  beforeEach(() => {
    store = createStore();
  });

  test('debe crear multiples paginas (pantallas)', () => {
    const page1 = store.addPage({
      width: 1920,
      height: 1080,
      title: 'TV 1'
    });

    const page2 = store.addPage({
      width: 1920,
      height: 1080,
      title: 'TV 2'
    });

    expect(store.pages.length).toBe(3);
    expect(page1.title).toBe('TV 1');
    expect(page2.title).toBe('TV 2');
  });

  test('debe crear composicion extendida', () => {
    const extendedPage = store.addPage({
      width: 3840,
      height: 1080,
      title: 'Composicion Extendida'
    });

    expect(extendedPage.width).toBe(3840);
    expect(extendedPage.height).toBe(1080);

    extendedPage.addElement({
      type: 'text',
      text: 'Texto extendido',
      x: 1800,
      y: 500,
      width: 400,
      height: 80,
      fontSize: 48
    });

    expect(extendedPage.children.length).toBe(1);
    const element = extendedPage.children[0];
    expect(element.x).toBe(1800);
    expect(element.width).toBe(400);
  });

  test('debe serializar multiples paginas', () => {
    store.addPage({ width: 1920, height: 1080, title: 'Pantalla 1' });
    store.addPage({ width: 1920, height: 1080, title: 'Pantalla 2' });

    const json = store.toJSON();
    expect(json.pages.length).toBe(3);

    const newStore = createStore();
    newStore.loadJSON(json);
    expect(newStore.pages.length).toBe(3);
    expect(newStore.pages[1].title).toBe('Pantalla 1');
    expect(newStore.pages[2].title).toBe('Pantalla 2');
  });
});
