import {setFavorite,loginRequest} from "../../actions";
import movieMock from "../../__mocks__/movieMock";

describe("Actions",()=>{
    test("SetFavorite",()=>{
        const payload = movieMock;
        const expectedAction= {
            type:"SET_FAVORITE",
            payload,
        }
        expect(setFavorite(payload)).toEqual(expectedAction)
    })


    test("LoginRequest",()=>{
        const payload={
            email:"test@test.com",
            password:"test"
        }
        const expectedAction = {
            type:"LOGIN_REQUEST",
            payload
        }
        expect(loginRequest(payload)).toEqual(expectedAction)
    })
})