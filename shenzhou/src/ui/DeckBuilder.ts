import { CARDS } from '../data/cards';
import type { CardData } from '../models/types';

const TYPE_LABEL: Record<string, string> = {
  minion: '随从', spell: '法术', weapon: '武器',
};

export class DeckBuilder {
  private deck: string[] = [];
  private heroClass: string = 'neutral';
  private filterText = '';
  private filterType = 'all';
  private onDone: (deck: string[]) => void;

  constructor(heroClass: string, onDone: (deck: string[]) => void) {
    this.heroClass = heroClass;
    this.onDone = onDone;
  }

  buildDefaultDeck(): string[] {
    const available = CARDS.filter(c => c.heroClass === 'neutral' || c.heroClass === this.heroClass);
    // Build a balanced default deck
    const deck: string[] = [];
    const minions = available.filter(c => c.type === 'minion').sort((a, b) => a.cost - b.cost);
    const spells = available.filter(c => c.type === 'spell').sort((a, b) => a.cost - b.cost);
    const weapons = available.filter(c => c.type === 'weapon');

    // Add 2 copies of each (up to 30)
    for (const c of minions) {
      if (deck.length < 24) { deck.push(c.id); deck.push(c.id); }
    }
    for (const c of spells) {
      if (deck.length < 28) { deck.push(c.id); deck.push(c.id); }
    }
    for (const c of weapons) {
      if (deck.length < 30) { deck.push(c.id); }
    }
    return deck.slice(0, 30);
  }

  mount(container: HTMLElement) {
    container.innerHTML = this.render();
    this.bindEvents(container);
  }

  private getAvailableCards(): CardData[] {
    return CARDS.filter(c =>
      c.heroClass === 'neutral' || c.heroClass === this.heroClass
    ).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  }

  private filteredCards(): CardData[] {
    let cards = this.getAvailableCards();
    if (this.filterText) {
      const q = this.filterText.toLowerCase();
      cards = cards.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    if (this.filterType !== 'all') {
      cards = cards.filter(c => c.type === this.filterType);
    }
    return cards;
  }

  private countInDeck(id: string): number {
    return this.deck.filter(d => d === id).length;
  }

  private render(): string {
    const cards = this.filteredCards();
    const deckCounts: Record<string, number> = {};
    for (const id of this.deck) deckCounts[id] = (deckCounts[id] || 0) + 1;

    const deckCards = Object.entries(deckCounts)
      .map(([id, count]) => ({ card: CARDS.find(c => c.id === id)!, count }))
      .filter(x => x.card)
      .sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name));

    return `
      <div class="deck-builder">
        <div class="deck-builder-header">
          <h2>🃏 构筑卡组</h2>
          <div class="deck-count">${this.deck.length}/30</div>
        </div>
        <div class="deck-builder-body">
          <!-- Left: card pool -->
          <div class="card-pool-panel">
            <div class="filter-bar">
              <input type="text" class="filter-input" placeholder="搜索卡牌..." value="${this.filterText}">
              <select class="filter-type">
                <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>全部类型</option>
                <option value="minion" ${this.filterType === 'minion' ? 'selected' : ''}>随从</option>
                <option value="spell" ${this.filterType === 'spell' ? 'selected' : ''}>法术</option>
                <option value="weapon" ${this.filterType === 'weapon' ? 'selected' : ''}>武器</option>
              </select>
            </div>
            <div class="card-pool-list">
              ${cards.map(c => this.renderCardRow(c)).join('')}
            </div>
          </div>
          <!-- Right: current deck -->
          <div class="deck-panel">
            <div class="deck-list">
              ${deckCards.map(({ card, count }) => `
                <div class="deck-card-row" data-id="${card.id}">
                  <span class="deck-card-cost cost-gem">${card.cost}</span>
                  <span class="deck-card-art">${card.art}</span>
                  <span class="deck-card-name">${card.name}</span>
                  <span class="deck-card-count">×${count}</span>
                  <button class="deck-remove-btn" data-remove="${card.id}">−</button>
                </div>
              `).join('')}
              ${this.deck.length === 0 ? '<div class="deck-empty-hint">从左侧点击添加卡牌</div>' : ''}
            </div>
            <div class="deck-actions">
              <button class="btn-default-deck">默认卡组</button>
              <button class="btn-clear-deck">清空</button>
              <button class="btn-start-game ${this.deck.length === 30 ? '' : 'disabled'}" ${this.deck.length < 30 ? 'disabled' : ''}>
                ${this.deck.length === 30 ? '开始游戏 →' : `还需${30 - this.deck.length}张牌`}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderCardRow(c: CardData): string {
    const count = this.countInDeck(c.id);
    const max = c.rarity === 'legendary' ? 1 : 2;
    const isFull = count >= max;
    const rarityClass = `rarity-${c.rarity}`;
    return `
      <div class="card-pool-row ${isFull ? 'card-full' : ''} ${rarityClass}" data-add="${c.id}">
        <span class="pool-card-cost cost-gem">${c.cost}</span>
        <span class="pool-card-art">${c.art}</span>
        <span class="pool-card-name">${c.name}</span>
        ${c.type === 'minion' ? `<span class="pool-card-stats">${c.attack}/${c.health}</span>` : ''}
        <span class="pool-card-type">${TYPE_LABEL[c.type]}</span>
        ${count > 0 ? `<span class="pool-card-count">×${count}</span>` : ''}
      </div>
    `;
  }

  private bindEvents(container: HTMLElement) {
    const filterInput = container.querySelector<HTMLInputElement>('.filter-input');
    const filterType = container.querySelector<HTMLSelectElement>('.filter-type');

    filterInput?.addEventListener('input', () => {
      this.filterText = filterInput.value;
      container.innerHTML = this.render();
      this.bindEvents(container);
    });

    filterType?.addEventListener('change', () => {
      this.filterType = filterType.value;
      container.innerHTML = this.render();
      this.bindEvents(container);
    });

    container.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.add!;
        const card = CARDS.find(c => c.id === id);
        if (!card) return;
        const max = card.rarity === 'legendary' ? 1 : 2;
        if (this.countInDeck(id) < max && this.deck.length < 30) {
          this.deck.push(id);
          container.innerHTML = this.render();
          this.bindEvents(container);
        }
      });
    });

    container.querySelectorAll('[data-remove]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (el as HTMLElement).dataset.remove!;
        const idx = this.deck.lastIndexOf(id);
        if (idx !== -1) { this.deck.splice(idx, 1); }
        container.innerHTML = this.render();
        this.bindEvents(container);
      });
    });

    container.querySelector('.btn-default-deck')?.addEventListener('click', () => {
      this.deck = this.buildDefaultDeck();
      container.innerHTML = this.render();
      this.bindEvents(container);
    });

    container.querySelector('.btn-clear-deck')?.addEventListener('click', () => {
      this.deck = [];
      container.innerHTML = this.render();
      this.bindEvents(container);
    });

    container.querySelector('.btn-start-game:not(.disabled)')?.addEventListener('click', () => {
      if (this.deck.length === 30) this.onDone([...this.deck]);
    });
  }
}
