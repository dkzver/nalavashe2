import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import type Game from './game/Game.js';
import type { GameAction, GameSnapshot } from './game/Game.js';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flame,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const initialSnapshot: GameSnapshot = {
  mode: 'menu',
  score: 0,
  distance: 0,
  collected: 0,
  best: 0,
};

const orderUrl = 'https://nalavashe-vl.ru/';
const numberFormat = new Intl.NumberFormat('ru-RU');
const actionLabels: Record<GameAction, string> = {
  left: 'влево',
  right: 'вправо',
  jump: 'прыжок',
  slide: 'подкат',
};

function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const gestureRef = useRef<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let active = true;
    let game: Game | null = null;
    import('./game/Game.js')
      .then(({ default: GameRuntime }) => {
        if (!active) return;
        game = new GameRuntime(mount, {
          onState: (nextSnapshot) => setSnapshot(nextSnapshot),
          onAction: (action) => setLastAction(actionLabels[action]),
        });
        gameRef.current = game;
        setSnapshot(game.state);
      })
      .catch(() => {
        if (active) setLoadError('Не удалось запустить 3D-игру. Обновите страницу и попробуйте ещё раз.');
      });

    return () => {
      active = false;
      game?.dispose();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isGameKey = [
        'arrowleft', 'arrowright', 'arrowup', 'arrowdown',
        'a', 'd', 'w', 's', ' ', 'escape', 'enter',
      ].includes(key);
      if (!isGameKey) return;
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
        event.preventDefault();
      }

      const game = gameRef.current;
      if (!game) return;

      if (key === 'escape') {
        if (snapshot.mode === 'playing') game.pause();
        else if (snapshot.mode === 'paused') game.resume();
        return;
      }
      if (key === 'enter') {
        if (snapshot.mode === 'menu') {
          setHelpOpen(false);
          game.start();
        } else if (snapshot.mode === 'gameover') {
          game.restart();
        } else if (snapshot.mode === 'paused') {
          game.resume();
        }
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [snapshot.mode]);

  const startGame = () => {
    setHelpOpen(false);
    gameRef.current?.start();
  };

  const retryGame = () => {
    setHelpOpen(false);
    gameRef.current?.restart();
  };

  const toggleSound = () => {
    setSoundEnabled((enabled) => {
      const nextEnabled = !enabled;
      gameRef.current?.setSoundEnabled(nextEnabled);
      return nextEnabled;
    });
  };

  const act = (action: GameAction) => {
    if (snapshot.mode === 'playing') gameRef.current?.act(action);
  };

  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || (event.target as HTMLElement).closest('button')) return;
    gestureRef.current = { x: event.clientX, y: event.clientY };
  };

  const onStagePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gestureRef.current;
    gestureRef.current = null;
    if (!start || snapshot.mode !== 'playing') return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    event.preventDefault();
    if (Math.abs(dx) > Math.abs(dy)) act(dx < 0 ? 'left' : 'right');
    else act(dy < 0 ? 'jump' : 'slide');
  };

  const isLive = snapshot.mode === 'playing' || snapshot.mode === 'paused';
  const isNewBest = snapshot.score > 0 && snapshot.score >= snapshot.best;

  return (
    <main
      className="lava-app"
      data-testid="screen-game"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('button, a')) gameRef.current?.playButtonSound();
      }}
    >
      <div
        className="game-stage"
        onPointerDown={onStagePointerDown}
        onPointerUp={onStagePointerUp}
        onPointerCancel={() => { gestureRef.current = null; }}
        aria-label="Игровое поле LAVA DASH"
      >
        <div className="game-mount" ref={mountRef} />
      </div>

      <div className={`game-shell mode-${snapshot.mode}`}>
        <header className="topbar">
          <div className="brand-lockup" aria-label="LAVA DASH — На LAVAше">
            <div className="brand-mark"><Flame size={23} strokeWidth={2.7} /></div>
            <div className="brand-copy">
              <div className="brand-name">LAVA DASH</div>
              <div className="brand-sub">На LAVAше · Владивосток</div>
            </div>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
              aria-pressed={soundEnabled}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <a
              className="order-link"
              href={orderUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="link-restaurant-order"
            >
              Заказать еду <ArrowRight size={16} />
            </a>
          </div>
        </header>

        {snapshot.mode === 'menu' && (
          <>
            <section className="hero-card" aria-labelledby="game-title">
              <div className="eyebrow"><span className="eyebrow-dot" /> Аркада с огоньком</div>
              <h1 className="hero-title" id="game-title">LAVA<span>DASH</span></h1>
              <p className="hero-description">
                Лава близко. Уворачивайся, прыгай и собирай начинку — сколько продержишься на горячей трассе?
              </p>
              <div className="hero-buttons">
                <button className="button-primary" type="button" onClick={startGame} data-testid="button-start-run">
                  <Play size={18} fill="currentColor" /> Начать забег
                </button>
                <button className="button-secondary" type="button" onClick={() => setHelpOpen(true)} data-testid="button-how-to-play">
                  <HelpCircle size={18} /> Как играть
                </button>
              </div>
              <div className="best-score" data-testid="text-best-score">
                <div>
                  <div className="best-score-label">Лучший забег</div>
                  <div className="best-score-value">{numberFormat.format(snapshot.best)} очков</div>
                </div>
                <Flame size={21} />
              </div>
            </section>
            <div className="mascot-stamp" aria-hidden="true">
              <div className="mascot-flame">
                <span className="mascot-eyes"><i /><i /></span>
                <span className="mascot-smile" />
              </div>
              <div className="mascot-caption">Горячий забег</div>
            </div>
            <div className="help-hint">← → ДВИЖЕНИЕ &nbsp;·&nbsp; ПРОБЕЛ — ПРЫЖОК &nbsp;·&nbsp; ↓ — ПОДКАТ</div>
          </>
        )}

        {snapshot.mode === 'loading' && (
          <section className="loading-card" aria-live="polite" aria-label="Загрузка игры">
            <div className="loading-flame"><Flame size={26} fill="currentColor" /></div>
            <div className="loading-title">Разогреваем улицу</div>
            <div className="loading-track"><span /></div>
            <div className="loading-copy">Готовим трассу для забега</div>
          </section>
        )}

        {loadError && (
          <section className="loading-card" role="alert">
            <div className="loading-flame"><Flame size={26} fill="currentColor" /></div>
            <div className="loading-title">Игра не запустилась</div>
            <div className="loading-copy">{loadError}</div>
            <button className="button-primary loading-retry" type="button" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </section>
        )}

        {isLive && (
          <>
            <section className="hud" aria-label="Показатели забега">
              <div className="hud-item">
                <div className="hud-label">Очки</div>
                <div className="hud-value" data-testid="text-score">{numberFormat.format(snapshot.score)}</div>
              </div>
              <div className="hud-item">
                <div className="hud-label">Дистанция</div>
                <div className="hud-value" data-testid="text-distance">{numberFormat.format(Math.floor(snapshot.distance))}<small> м</small></div>
              </div>
              <div className="hud-item">
                <div className="hud-label">Собрано</div>
                <div className="hud-value" data-testid="text-collected">{numberFormat.format(snapshot.collected)}</div>
              </div>
              <div className="hud-pause">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => gameRef.current?.pause()}
                  aria-label="Пауза"
                  data-testid="button-pause"
                >
                  <Pause size={17} fill="currentColor" />
                </button>
              </div>
            </section>

            {snapshot.mode === 'playing' && (
              <div className="mobile-controls" aria-label="Игровое управление">
                <div className="touch-group">
                  <button className="touch-control" type="button" aria-label="Влево" onPointerDown={(event) => event.preventDefault()} onClick={() => act('left')} data-testid="button-move-left">
                    <ArrowLeft size={24} />
                  </button>
                  <button className="touch-control" type="button" aria-label="Вправо" onPointerDown={(event) => event.preventDefault()} onClick={() => act('right')} data-testid="button-move-right">
                    <ArrowRight size={24} />
                  </button>
                </div>
                <div className="touch-group">
                  <button className="touch-control primary" type="button" aria-label="Прыгнуть" onPointerDown={(event) => event.preventDefault()} onClick={() => act('jump')} data-testid="button-jump">
                    <ArrowUp size={24} />
                  </button>
                  <button className="touch-control" type="button" aria-label="Подкат" onPointerDown={(event) => event.preventDefault()} onClick={() => act('slide')} data-testid="button-slide">
                    <ArrowDown size={24} />
                  </button>
                </div>
              </div>
            )}

            <div className="live-message" aria-live="polite">
              {lastAction ? `Действие: ${lastAction}` : `Забег. Очки ${snapshot.score}, дистанция ${Math.floor(snapshot.distance)} метров`}
            </div>
          </>
        )}
      </div>

      {helpOpen && snapshot.mode === 'menu' && (
        <div className="overlay" role="presentation" onClick={() => setHelpOpen(false)}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button dialog-close" type="button" onClick={() => setHelpOpen(false)} aria-label="Закрыть" data-testid="button-close-help">
              <X size={19} />
            </button>
            <div className="dialog-kicker">Правила забега</div>
            <h2 className="dialog-title" id="help-title">Держись подальше от лавы</h2>
            <p className="dialog-copy">Меняй полосу и вовремя реагируй на препятствия. Собирай начинку по пути и ставь личный рекорд.</p>
            <div className="controls-list">
              <div className="control-row"><span className="control-key">← → / A D</span><span className="control-description">Сменить полосу</span></div>
              <div className="control-row"><span className="control-key">ПРОБЕЛ / ↑</span><span className="control-description">Прыгнуть через препятствие</span></div>
              <div className="control-row"><span className="control-key">↓ / S</span><span className="control-description">Подкатиться под преградой</span></div>
              <div className="control-row"><span className="control-key">ESC</span><span className="control-description">Пауза в любой момент</span></div>
            </div>
            <div className="dialog-actions">
              <button className="button-primary" type="button" onClick={startGame} data-testid="button-start-from-help">
                <Play size={17} fill="currentColor" /> Погнали
              </button>
              <a className="button-secondary" href={orderUrl} target="_blank" rel="noreferrer" data-testid="link-order-from-help">
                Заказать еду
              </a>
            </div>
          </section>
        </div>
      )}

      {snapshot.mode === 'paused' && (
        <div className="overlay">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <div className="dialog-kicker">Передышка</div>
            <h2 className="dialog-title" id="pause-title">Пауза</h2>
            <p className="dialog-copy">Трасса подождёт. Готов продолжить горячий забег?</p>
            <div className="score-panel">
              <div className="score-block"><small>Очки</small><strong>{numberFormat.format(snapshot.score)}</strong></div>
              <div className="score-block"><small>Дистанция</small><strong>{numberFormat.format(Math.floor(snapshot.distance))} м</strong></div>
            </div>
            <div className="dialog-actions">
              <button className="button-primary" type="button" onClick={() => gameRef.current?.resume()} data-testid="button-resume">
                <Play size={17} fill="currentColor" /> Продолжить
              </button>
              <button className="button-secondary" type="button" onClick={retryGame} data-testid="button-restart-paused">
                <RotateCcw size={17} /> Заново
              </button>
            </div>
          </section>
        </div>
      )}

      {snapshot.mode === 'gameover' && (
        <div className="overlay">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
            <div className="dialog-kicker">Забег окончен</div>
            <h2 className="dialog-title" id="gameover-title">Вот это жарко</h2>
            <p className="dialog-copy">Лава догнала — но этот результат уже в твоей истории. Ещё один заход?</p>
            <div className="score-panel">
              <div className="score-block"><small>Твой счёт</small><strong>{numberFormat.format(snapshot.score)}</strong></div>
              <div className="score-block"><small>Дистанция</small><strong>{numberFormat.format(Math.floor(snapshot.distance))} м</strong></div>
              <div className="score-block"><small>Собрано</small><strong>{numberFormat.format(snapshot.collected)}</strong></div>
              <div className="score-block"><small>Лучший</small><strong>{numberFormat.format(snapshot.best)}</strong></div>
            </div>
            {isNewBest && <span className="new-best">Новый рекорд</span>}
            <div className="dialog-actions">
              <button className="button-primary" type="button" onClick={retryGame} data-testid="button-retry">
                <RotateCcw size={17} /> Ещё забег
              </button>
            </div>
            <a className="order-link modal-order" href={orderUrl} target="_blank" rel="noreferrer" data-testid="link-order-gameover">
              Заказать еду в «На LAVAше» <ArrowRight size={16} />
            </a>
          </section>
        </div>
      )}
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
