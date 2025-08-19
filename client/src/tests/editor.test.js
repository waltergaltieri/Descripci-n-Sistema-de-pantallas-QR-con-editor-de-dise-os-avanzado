import { createStore } from 'polotno/model/store';
import { unstable_registerNextDomDrop } from 'polotno/config';

// Configurar Polotno para Next.js
unstable_registerNextDomDrop();

describe('Editor Polotno - Serialización', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      width: 1920,
      height: 1080,
      unit: 'px'
    });
  });

  test('debe crear un store vacío correctamente', () => {
    expect(store).toBeDefined();
    expect(store.pages.length).toBe(1);
    expect(store.activePage).toBeDefined();
  });

  test('debe serializar y deserializar un diseño vacío', () => {
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
      src: `<svg viewBox="0 0 100 100"><rect width="100" height="100" /></svg>`
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

  test('debe manejar múltiples elementos', () => {
    // Agregar texto
    store.activePage.addElement({
      type: 'text',
      text: 'Título',
      x: 50,
      y: 50,
      fontSize: 32
    });

    // Agregar imagen
    store.activePage.addElement({
      type: 'image',
      src: 'https://via.placeholder.com/200x150',
      x: 100,
      y: 150
    });

    // Agregar forma
    store.activePage.addElement({
      type: 'svg',
      x: 300,
      y: 100,
      width: 80,
      height: 80,
      fill: '#00ff00',
      src: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" /></svg>`
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

  test('debe agregar animación fade', () => {
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

  test('debe agregar animación slide', () => {
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

  test('debe agregar animación scale', () => {
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

  test('debe agregar animación rotate', () => {
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

  test('debe agregar múltiples animaciones', () => {
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

  test('debe crear múltiples páginas (pantallas)', () => {
    // Página para TV 1
    const page1 = store.addPage({
      width: 1920,
      height: 1080,
      title: 'TV 1'
    });

    // Página para TV 2
    const page2 = store.addPage({
      width: 1920,
      height: 1080,
      title: 'TV 2'
    });

    expect(store.pages.length).toBe(3); // Incluye la página inicial
    expect(page1.title).toBe('TV 1');
    expect(page2.title).toBe('TV 2');
  });

  test('debe crear composición extendida', () => {
    // Composición extendida para 2 TVs horizontales
    const extendedPage = store.addPage({
      width: 3840, // 1920 * 2
      height: 1080,
      title: 'Composición Extendida'
    });

    expect(extendedPage.width).toBe(3840);
    expect(extendedPage.height).toBe(1080);

    // Agregar elemento que cruza ambas pantallas
    extendedPage.addElement({
      type: 'text',
      text: 'Texto extendido',
      x: 1800, // Cruza el límite de 1920px
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

  test('debe serializar múltiples páginas', () => {
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