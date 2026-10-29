"use client";

import { useRef, useState } from "react";
import { Download, Keyboard, Minus, Monitor, Moon, Plus, RotateCcw, Smartphone, Sun, Upload, Volume2, VolumeX } from "lucide-react";
import Sheet from "../elements/Sheet";
import { PageSkeleton } from "../elements/Visuals";
import { today } from "../lib/dates";
import { useInstall, useReady, useSound, useTheme } from "../lib/hooks";
import { downloadJson, readExport } from "../lib/io";
import { setSoundOn, sound } from "../lib/sound";
import { exportData, useStore, type ExportData } from "../lib/store";
import { setTheme, type Theme } from "../lib/theme";
import { toast } from "../lib/toast";

export default function SettingsView() {
  const ready = useReady();
  if (!ready) return <PageSkeleton />;
  return <Settings />;
}

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "dark", label: "Тёмная", icon: Moon },
  { id: "light", label: "Светлая", icon: Sun },
  { id: "auto", label: "Авто", icon: Monitor },
];

const KEYS = [
  ["Пробел / Enter", "показать ответ"],
  ["1 / ←", "не помню"],
  ["2 / ↓", "с трудом"],
  ["3 / →", "легко"],
  ["E", "изменить карточку"],
  ["Esc", "выйти из сессии"],
];

function Settings() {
  const theme = useTheme();
  const soundOn = useSound();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const importData = useStore((s) => s.importData);
  const resetProgress = useStore((s) => s.resetProgress);
  const { canPrompt, installed, ios, install } = useInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ExportData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(await readExport(file));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не удалось прочитать файл", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = (mode: "merge" | "replace") => {
    if (!pending) return;
    const result = importData(pending, mode);
    setPending(null);
    toast(`Импортировано: ${result.decks} колод, ${result.cards} карточек`);
  };

  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <p className="eyebrow">настройки</p>
        <h1 className="font-display mt-1 text-3xl">Ещё</h1>
      </header>

      {!installed && (
        <section className="tile relative animate-rise overflow-hidden p-5 [animation-delay:40ms]">
          <div className="relative flex items-start gap-4">
            <div className="grid size-12 shrink-0 animate-float place-items-center rounded-2xl bg-primary text-on-primary">
              <Smartphone size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base">Установить на телефон</h2>
              <p className="mt-1 text-sm text-mute">
                {canPrompt
                  ? "Иконка на главном экране, полный экран и работа без сети — удобно повторять в метро."
                  : ios
                    ? "В Safari нажми «Поделиться» → «На экран „Домой“». Приложение заработает без сети."
                    : "Открой меню браузера и выбери «Установить приложение» или «Добавить на главный экран»."}
              </p>
              {canPrompt && (
                <button onClick={install} className="btn btn-primary mt-4 min-h-11">
                  Установить
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="tile animate-rise space-y-5 p-5 [animation-delay:80ms]">
        <div>
          <p className="eyebrow mb-2.5">Тема</p>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-2 p-1.5">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  theme === id ? "bg-surface-solid text-text" : "text-mute"
                }`}
              >
                <Icon size={17} className={theme === id ? "animate-pop" : ""} /> {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setSoundOn(!soundOn);
            if (!soundOn) setTimeout(sound.easy, 50);
          }}
          className="flex w-full items-center gap-3 text-left"
          role="switch"
          aria-checked={soundOn}
        >
          {soundOn ? <Volume2 size={22} className="text-text" /> : <VolumeX size={22} className="text-dim" />}
          <span className="flex-1 font-semibold">Звуки и вибрация</span>
          <span className={`relative h-8 w-14 rounded-full transition-colors ${soundOn ? "bg-primary" : "bg-surface-2"}`}>
            <span
              className={`absolute top-1 size-6 rounded-full shadow transition-all ${soundOn ? "bg-on-primary" : "bg-text"} duration-300 ease-[var(--ease-spring)] ${
                soundOn ? "left-7" : "left-1"
              }`}
            />
          </span>
        </button>
      </section>

      <section className="tile animate-rise space-y-4 p-5 [animation-delay:120ms]">
        <Stepper
          label="Новых карточек в день"
          hint="Сколько незнакомых вопросов добавлять к повторениям"
          value={settings.newPerDay}
          min={0}
          max={60}
          step={5}
          onChange={(newPerDay) => setSettings({ newPerDay })}
        />
        <div className="border-t-2 border-dashed border-line" />
        <Stepper
          label="Карточек в сессии"
          hint="Короткие сессии легче делать каждый день"
          value={settings.sessionSize}
          min={5}
          max={60}
          step={5}
          onChange={(sessionSize) => setSettings({ sessionSize })}
        />
      </section>

      <section className="tile animate-rise space-y-3 p-5 [animation-delay:160ms]">
        <p className="eyebrow">Данные</p>
        <p className="text-sm text-mute">
          Всё хранится только на этом устройстве. Сохрани копию, чтобы перенести прогресс на другой телефон или ноутбук.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              downloadJson(exportData(), `synapse-backup-${today()}.json`);
              toast("Копия сохранена");
            }}
            className="btn btn-soft"
          >
            <Download size={18} /> Экспорт
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-outline">
            <Upload size={18} /> Импорт
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button onClick={() => setConfirmReset(true)} className="btn btn-ghost w-full text-sm text-again">
          <RotateCcw size={16} /> Сбросить весь прогресс
        </button>
      </section>

      <section className="tile hidden animate-rise p-5 [animation-delay:200ms] sm:block">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Keyboard size={16} /> Горячие клавиши в сессии
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {KEYS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <span className="kbd opacity-80">{k}</span>
              </dt>
              <dd className="text-mute">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tile animate-rise p-5 text-sm text-mute [animation-delay:240ms]">
        <p className="eyebrow mb-2">Как работает повторение</p>
        <p>
          Алгоритм SM-2: у каждой карточки есть интервал и «лёгкость». «Легко» растит интервал в ~2.5 раза,
          «с трудом» — в 1.2 раза и снижает лёгкость, «не помню» возвращает карточку на завтра и ещё раз в этой же сессии.
          Карточка с интервалом от трёх недель считается выученной.
        </p>
      </section>

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Импорт">
        {pending && (
          <>
            <p className="text-mute">
              В файле {pending.decks.length} колод и {pending.cards.length} карточек.
            </p>
            <div className="mt-5 space-y-3">
              <button onClick={() => runImport("merge")} className="btn btn-primary w-full">
                Добавить к моим
              </button>
              <button onClick={() => runImport("replace")} className="btn btn-outline w-full text-again">
                Заменить всё
              </button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Сбросить прогресс?">
        <p className="text-mute">Все карточки станут новыми, статистика и стрик обнулятся. Сами карточки останутся.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirmReset(false)} className="btn btn-outline flex-1">
            Отмена
          </button>
          <button
            onClick={() => {
              resetProgress();
              setConfirmReset(false);
              toast("Прогресс сброшен");
            }}
            className="btn btn-again flex-1"
          >
            Сбросить
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-mute">{hint}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="btn btn-outline size-10 min-h-0 rounded-xl p-0"
          aria-label="Меньше"
        >
          <Minus size={18} />
        </button>
        <span key={value} className="font-display w-10 animate-pop text-center text-lg tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="btn btn-outline size-10 min-h-0 rounded-xl p-0"
          aria-label="Больше"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
