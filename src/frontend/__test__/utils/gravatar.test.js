import gravatar from "../../utils/gravatar";

test("Gravatar Function Test",()=>{
    const email = "tomasgoldenberg@hotmail.com";
    const gravatarUrl= "https://gravatar.com/avatar/31302b2e23dc89f7878e5a96056198e9";
    expect(gravatarUrl).toEqual(gravatar(email))
})