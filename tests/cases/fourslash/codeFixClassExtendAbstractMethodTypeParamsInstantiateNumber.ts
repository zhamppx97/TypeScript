/// <reference path='fourslash.ts' />

////abstract class A<T> {
////    abstract f(x: T): T;
////}
////
////class C extends A<number> {}

verify.codeFix({
    description: "Implement inherited abstract class",
    // TODO: GH#18795
    newFileContent:
`abstract class A<T> {
    abstract f(x: T): T;
}

class C extends A<number> {
    f(x: number): number {
        throw new Error("Method not implemented.");
    }
}`
});
