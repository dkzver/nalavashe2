const KEY_ACTIONS = new Map([
  ['ArrowLeft', 'left'], ['a', 'left'], ['A', 'left'],
  ['ArrowRight', 'right'], ['d', 'right'], ['D', 'right'],
  ['ArrowUp', 'jump'], ['w', 'jump'], ['W', 'jump'], [' ', 'jump'],
  ['ArrowDown', 'slide'], ['s', 'slide'], ['S', 'slide'],
]);

export default class Controls {
  constructor(onAction) {
    this.onAction = onAction;
    this.keydown = (event) => {
      const action = KEY_ACTIONS.get(event.key);
      if (!action || event.repeat) return;
      event.preventDefault();
      this.onAction(action);
    };
    window.addEventListener('keydown', this.keydown);
  }

  dispose() {
    window.removeEventListener('keydown', this.keydown);
  }
}
