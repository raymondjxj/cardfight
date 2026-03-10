import { HEROES } from '../data/heroes';
import type { HeroData } from '../models/types';

export class HeroSelect {
  private selected: string = '';
  private onSelect: (heroId: string) => void;

  constructor(onSelect: (heroId: string) => void) {
    this.onSelect = onSelect;
  }

  mount(container: HTMLElement) {
    container.innerHTML = this.render();
    this.bindEvents(container);
  }

  private render(): string {
    return `
      <div class="hero-select-screen">
        <div class="hero-select-title">
          <h1>⚔️ 神州争霸</h1>
          <p>选择你的英雄，开始战斗！</p>
        </div>
        <div class="hero-grid">
          ${HEROES.map(h => this.renderHeroCard(h)).join('')}
        </div>
        <button class="btn-confirm-hero ${this.selected ? '' : 'disabled'}" ${this.selected ? '' : 'disabled'}>
          ${this.selected ? '确认选择 →' : '请选择英雄'}
        </button>
      </div>
    `;
  }

  private renderHeroCard(h: HeroData): string {
    const isSelected = this.selected === h.id;
    return `
      <div class="hero-card ${isSelected ? 'hero-selected' : ''}" data-hero="${h.id}" style="--hero-color:${h.themeColor}">
        <div class="hero-avatar-large">${h.art}</div>
        <div class="hero-card-name">${h.name}</div>
        <div class="hero-card-title">${h.title}</div>
        <div class="hero-card-desc">${h.description}</div>
        <div class="hero-passive">
          <span class="passive-label">被动</span>
          ${h.passiveDescription}
        </div>
        <div class="hero-skill-preview">
          <span class="hero-skill-art">${h.skill.art}</span>
          <span class="hero-skill-info">
            <strong>${h.skill.name}</strong>（${h.skill.cost}费）<br>
            ${h.skill.description}
          </span>
        </div>
      </div>
    `;
  }

  private bindEvents(container: HTMLElement) {
    container.querySelectorAll('[data-hero]').forEach(el => {
      el.addEventListener('click', () => {
        this.selected = (el as HTMLElement).dataset.hero!;
        container.innerHTML = this.render();
        this.bindEvents(container);
      });
    });

    container.querySelector('.btn-confirm-hero:not(.disabled)')?.addEventListener('click', () => {
      if (this.selected) this.onSelect(this.selected);
    });
  }
}
