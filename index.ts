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