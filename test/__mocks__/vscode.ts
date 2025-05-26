// Mock VS Code API for testing
export class Range {
  start: Position;
  end: Position;

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }
}

export class Position {
  line: number;
  character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }
}

export class Uri {
  static parse(value: string): Uri {
    return new Uri();
  }
}

export enum EndOfLine {
  LF = 1,
  CRLF = 2
}

export interface TextDocument {
  languageId: string;
  getText(): string;
  positionAt(offset: number): Position;
}

export const window = {
  activeTextEditor: undefined,
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'enabled') return true;
      if (key === 'showInlineComments') return true;
      return undefined;
    }),
    update: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
};

export const commands = {
  registerCommand: jest.fn(),
};

export const languages = {
  registerInlineCompletionItemProvider: jest.fn(),
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export const Disposable = {
  from: jest.fn(() => ({ dispose: jest.fn() })),
};
