import { createElement } from './dom.js';
import { createNavbar } from './navbar.js';
import { createSidebar } from './sidebar.js';

export class AppLayout {
  constructor(root, options) {
    this.root = root;
    this.options = options;
  }

  render() {
    const skip = createElement('a', {
      className: 'skip-link btn btn-primary',
      text: 'К содержимому',
      attributes: { href: '#main-content' }
    });
    const shell = createElement('div', { className: 'app-shell' });
    const body = createElement('div', { className: 'app-body' });
    const main = createElement('main', {
      className: 'app-main',
      attributes: { id: 'main-content', tabindex: '-1' }
    });
    const content = createElement('div', { className: 'app-content' });
    const heading = createElement('header', { className: 'app-page-heading' });
    heading.append(
      createElement('h1', { className: 'h2', text: this.options.title }),
      createElement('p', { className: 'text-body-secondary mb-0', text: 'Этап 2: базовая структура интерфейса' })
    );
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const cardBody = createElement('div', { className: 'card-body' });
    cardBody.append(createElement('p', { className: 'mb-0', text: this.options.content }));
    card.append(cardBody);
    content.append(heading, card);
    main.append(content);
    body.append(createSidebar(this.options.activeNav), main);
    shell.append(createNavbar(), body);
    this.root.replaceChildren(skip, shell);
  }
}
