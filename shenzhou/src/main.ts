import './style.css';
import { GameState } from './game/GameState';
import { CombatSystem } from './game/CombatSystem';
import { AIController } from './game/AIController';
import { HeroSelect } from './ui/HeroSelect';
import { DeckBuilder } from './ui/DeckBuilder';
import { GameBoard } from './ui/GameBoard';
import { HEROES } from './data/heroes';

class App {
  private gs!: GameState;
  private combat!: CombatSystem;
  private ai!: AIController;
  private board!: GameBoard;
  private container: HTMLElement;
  private selectedHeroId = '';
  private playerDeck: string[] = [];

  constructor() {
    this.container = document.getElementById('app')!;
    this.showHeroSelect();
  }

  private showHeroSelect() {
    this.container.className = 'screen-hero-select';
    const hs = new HeroSelect((heroId) => {
      this.selectedHeroId = heroId;
      this.showDeckBuilder(heroId);
    });
    hs.mount(this.container);
  }

  private showDeckBuilder(heroId: string) {
    const heroData = HEROES.find(h => h.id === heroId)!;
    this.container.className = 'screen-deck-builder';
    const db = new DeckBuilder(heroData.heroClass, (deck) => {
      this.playerDeck = deck;
      this.startGame();
    });
    db.mount(this.container);
  }

  private startGame() {
    this.gs = new GameState();
    this.combat = new CombatSystem(this.gs);

    // Pick random opponent hero (different from player)
    const opponents = HEROES.filter(h => h.id !== this.selectedHeroId);
    const opponentHero = opponents[Math.floor(Math.random() * opponents.length)];

    // Build opponent deck
    const db = new DeckBuilder(opponentHero.heroClass, () => {});
    const opponentDeck = db.buildDefaultDeck();

    this.gs.initGame({
      playerHeroId: this.selectedHeroId,
      playerDeck: this.playerDeck,
      opponentHeroId: opponentHero.id,
      opponentDeck,
    });

    this.ai = new AIController(this.gs, this.combat);

    this.container.className = 'screen-game';
    this.board = new GameBoard(
      this.gs,
      this.combat,
      () => this.handleEndTurn(),
      () => this.handleReset(),
    );
    this.board.mount(this.container);
  }

  private async handleEndTurn() {
    this.board.setAILock(true);
    this.combat.applyEndOfTurnPassives('player');
    this.combat.resetTurnPassives();
    this.gs.endTurn();
    this.board.rerender(this.container);

    if (this.gs.phase === 'game-over') {
      this.board.setAILock(false);
      this.board.rerender(this.container);
      return;
    }

    // AI turn
    await this.ai.playTurn(() => {
      this.board.rerender(this.container);
    });

    this.combat.applyEndOfTurnPassives('opponent');
    this.gs.endTurn();
    this.combat.resetTurnPassives();
    this.board.setAILock(false);
    this.board.rerender(this.container);
  }

  private handleReset() {
    this.showHeroSelect();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
