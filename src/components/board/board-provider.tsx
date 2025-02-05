import { BoardSourceDriver } from "@/drivers/board-source/base-source";
import { createContext, PropsWithChildren, useContext } from "react";

interface BoardContextProps {
  sources?: BoardSourceDriver;
}

const BoardContext = createContext<BoardContextProps>({});

export function useBoardContext() {
  return useContext(BoardContext);
}

export function BoardProvider({
  children,
  sources,
}: PropsWithChildren<BoardContextProps>) {
  return (
    <BoardContext.Provider value={{ sources }}>
      {children}
    </BoardContext.Provider>
  );
}
