import React from "react";
import {mount} from "enzyme";
import ProviderMock from "../../__mocks__/ProviderMock";
import Register from "../../containers/Register";

describe("<Register />",()=>{
    test("Register Form",()=>{
        const preventDefault = jest.fn();
        const register = mount(
            <ProviderMock>
                <Register />
            </ProviderMock>
        );
        register.find("form").simulate("submit",{preventDefault});
        expect(preventDefault).toHaveBeenCalledTimes(1);
        register.unmount()
    })
})