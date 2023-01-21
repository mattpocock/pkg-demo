export class Add {
  constructor ( private a: number, private b: number ) {
    this.a = a;
    this.b = b;
    this.run();
  }
  run (): number {
    return this.a + this.b;
  }
}

export class Subtract {
  constructor ( private numbers: Array<number> ) {
    this.numbers = [];
  }

  run (): number {
    return this.numbers.reduce( ( previousNumber: number, currentNumber: number ) => {
      return previousNumber - currentNumber;
    }, 0 );
  }
}