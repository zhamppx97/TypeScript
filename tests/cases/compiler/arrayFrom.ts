// @lib: es2015

// Tests fix for #20432, ensures Array.from accepts all valid inputs
// Also tests for #19682

interface A {
  a: string;
}

interface B {
  b: string;
}

const inputA: A[] = [];
const inputB: B[] = [];
const inputALike: ArrayLike<A> = { length: 0 };
const inputARand = getEither(inputA, inputALike);

const result1: A[] = Array.from(inputA);
const result2: A[] = Array.from(inputA.values());
const result3: B[] = Array.from(inputA.values()); // expect error
const result4: A[] = Array.from(inputB, ({ b }): A => ({ a: b }));
const result5: A[] = Array.from(inputALike);
const result6: B[] = Array.from(inputALike); // expect error
const result7: B[] = Array.from(inputALike, ({ a }): B => ({ b: a }));
const result8: A[] = Array.from(inputARand);
const result9: B[] = Array.from(inputARand, ({ a }): B => ({ b: a }));

// if this is written inline, the compiler seems to infer
// the ?: as always taking the false branch, narrowing to ArrayLike<T>,
// even when the type is written as : Iterable<T>|ArrayLike<T>
function getEither<T> (in1: Iterable<T>, in2: ArrayLike<T>) {
  return Math.random() > 0.5 ? in1 : in2;
}
