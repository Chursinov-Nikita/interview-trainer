import { ViewTransition } from "react";

// Обёртка каждой страницы: при переходе старая уходит вверх, новая всплывает снизу.
// Стоит в page, а не в layout — layout живёт между переходами, и enter/exit там не срабатывают.
export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
