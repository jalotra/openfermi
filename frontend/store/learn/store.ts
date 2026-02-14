import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import { flattenActions } from "../flattenActions";
import { initialLearnState } from "./initialState";
import { SessionActionImpl } from "./sessionAction";
import { PlayerActionImpl } from "./playerAction";
import type { LearnStore, SessionAction, PlayerAction } from "./types";

type LearnStoreAction = SessionAction & PlayerAction;

const createStore: StateCreator<LearnStore, [["zustand/devtools", never]]> = (
  ...params
) => ({
  ...initialLearnState,
  ...flattenActions<LearnStoreAction>([
    new SessionActionImpl(...params),
    new PlayerActionImpl(...params),
  ]),
});

export const useLearnStore = create<LearnStore>()(
  devtools(createStore, { name: "LearnStore" }),
);
