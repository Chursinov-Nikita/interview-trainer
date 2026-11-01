"use client";

import { useRef, useState } from "react";
import { Download, Minus, Monitor, Moon, Plus, RotateCcw, Smartphone, Sun, Upload, Volume2, VolumeX } from "lucide-react";
import Sheet from "../elements/Sheet";
import { PageSkeleton } from "../elements/Visuals";
import { plu, today } from "../lib/dates";
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
  ["1 / ←", "не знаю"],
  ["2 / ↓", "почти"],
  ["3 / →", "знаю"],
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
    toast(`Импортировано: ${plu(result.decks, ["колода", "колоды", "колод"])}, ${plu(result.cards, ["карточка", "карточки", "карточек"])}`);
  };

  return (
    <div>
      <header className="pb-6">
        <h1 className="text-2xl font-medium">Настройки</h1>
        <p className="mt-1 text-mute">Всё хранится на этом устройстве и работает без сети</p>
      </header>

      <div className="divide-y divide-line">

        <Row title="Внешний вид" desc="Тема и звуки в сессии повторения.">
          <p className="text-[13px] text-dim">Тема</p>
          <div className="mt-2 inline-grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                aria-pressed={theme === id}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  theme === id ? "bg-bg text-text" : "text-mute hover:text-text"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              if (!soundOn) setTimeout(sound.easy, 50);
            }}
            className="mt-5 flex w-full items-center gap-3 border-t border-line pt-4 text-left"
            role="switch"
            aria-checked={soundOn}
          >
            {soundOn ? <Volume2 size={18} className="text-text" /> : <VolumeX size={18} className="text-dim" />}
            <span className="flex-1">
              <span className="block font-medium">Звуки и вибрация</span>
              <span className="block text-[13px] text-dim">Короткий звук на каждую оценку</span>
            </span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${soundOn ? "bg-primary" : "bg-surface-2"}`}>
              <span
                className={`absolute top-0.5 size-4 rounded-full transition-[left,background-color] duration-200 ${
                  soundOn ? "left-[18px] bg-on-primary" : "left-0.5 bg-mute"
                }`}
              />
            </span>
          </button>
        </Row>

        <Row
          title="Повторения"
          desc={`Сейчас: ${plu(settings.newPerDay, ["новая карточка", "новые карточки", "новых карточек"])} в день, по ${settings.sessionSize} в сессии.`}
        >
          <Stepper
            label="Новых карточек в день"
            hint="Сколько незнакомых вопросов добавлять к повторениям"
            value={settings.newPerDay}
            min={0}
            max={60}
            step={5}
            onChange={(newPerDay) => setSettings({ newPerDay })}
          />
          <div className="my-4 border-t border-line" />
          <Stepper
            label="Карточек в сессии"
            hint="Короткие сессии легче делать каждый день"
            value={settings.sessionSize}
            min={5}
            max={60}
            step={5}
            onChange={(sessionSize) => setSettings({ sessionSize })}
          />
        </Row>

        <Row title="Данные" desc="Сохрани копию, чтобы перенести прогресс на другой телефон или ноутбук.">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              onClick={() => {
                downloadJson(exportData(), `synapse-backup-${today()}.json`);
                toast("Копия сохранена");
              }}
              className="btn min-h-9 px-4 text-sm"
            >
              <Download size={16} /> Экспорт
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn min-h-9 px-4 text-sm">
              <Upload size={16} /> Импорт
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </Row>

        <Row title="Горячие клавиши" desc="Работают в сессии повторения на компьютере." className="hidden md:grid">
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
            {KEYS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <span className="kbd opacity-80">{k}</span>
                </dt>
                <dd className="text-mute">{v}</dd>
              </div>
            ))}
          </dl>
        </Row>

        <Row title="Сброс прогресса" desc="Все карточки станут новыми, статистика и серия обнулятся. Сами карточки останутся.">
          <button onClick={() => setConfirmReset(true)} className="btn min-h-9 w-full px-4 text-sm text-again sm:w-auto">
            <RotateCcw size={16} /> Сбросить весь прогресс
          </button>
        </Row>
      </div>

      {!installed && (
        <div className="flex items-center justify-center gap-2 border-t border-line pt-6 text-center text-[13px] text-dim">
          <Smartphone size={15} className="shrink-0" />
          {canPrompt ? (
            <button onClick={install} className="underline underline-offset-4 hover:text-text">
              Установить на телефон
            </button>
          ) : (
            <span>
              {ios ? "«Поделиться» → «На экран „Домой“»" : "Меню браузера → «На главный экран»"}
            </span>
          )}
        </div>
      )}

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Импорт">
        {pending && (
          <>
            <p className="text-mute">
              В файле {plu(pending.decks.length, ["колода", "колоды", "колод"])} и {plu(pending.cards.length, ["карточка", "карточки", "карточек"])}.
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
        <p className="font-medium">{label}</p>
        <p className="text-[13px] text-dim">{hint}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="btn size-9 min-h-0 p-0"
          aria-label="Меньше"
        >
          <Minus size={16} />
        </button>
        <span className="num w-10 text-center text-base">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="btn size-9 min-h-0 p-0"
          aria-label="Больше"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  children,
  className = "grid",
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${className} gap-4 py-8 first:pt-0 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-10`}>
      <div className="md:pt-[22px]">
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-1 text-mute">{desc}</p>
      </div>
      <div className="tile p-[22px]">{children}</div>
    </section>
  );
}
