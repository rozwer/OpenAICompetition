import {test,expect} from "@playwright/test";
test("visit and favorite persist, interpretation is separate and map highlights the relationship",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");await page.getByRole("button",{name:"利用者 A で始める"}).click();await page.getByRole("button",{name:"地図をひらく"}).click();await page.getByRole("button",{name:"行き先をAIと探す"}).click();await page.getByRole("button",{name:/周辺の場所/}).click();
 const sheet=page.locator(".poi-dialog");await sheet.locator(".poi-list button").first().click();await expect(sheet.getByRole("heading",{name:"あなたとこの場所"})).toBeVisible();await sheet.getByRole("button",{name:"♡ お気に入りにする"}).click();await expect(sheet.getByRole("button",{name:"♥ お気に入り"})).toHaveAttribute("aria-pressed","true");
 await sheet.getByRole("button",{name:"訪問を記録",exact:true}).click();await sheet.getByLabel("滞在時間（分・不明なら空欄）").fill("45");await sheet.getByRole("button",{name:"この訪問を保存"}).click();await expect(sheet.locator(".relation-facts")).toContainText("45");await page.screenshot({path:".local/personal-relationship.png"});await sheet.getByRole("button",{name:"周辺情報を閉じる"}).click();await expect(page.locator(".personal-map-legend")).toHaveCount(0);
 const response=await page.request.post("/api/personal",{data:{op:"state"}});const state=await response.json();expect(state.visits.length).toBeGreaterThan(0);expect(state.relations.some((r:{favorite:boolean})=>r.favorite)).toBe(true);
 await page.getByRole("button",{name:"ホーム",exact:true}).click();await page.getByRole("button",{name:"プロフィールをひらく"}).click();
 await page.route("**/api/personal",async route=>{if(route.request().postDataJSON().op!=="generate")return route.continue();const result={summary:"画面検証用: 最近の行動にカフェ滞在が見られます。",personaCards:[{id:"mode",name:"街の休憩時間",description:"画面検証用の解釈です。",contexts:[],traits:["滞在"],confidence:0.6,trend:null,evidenceIds:["current:test"]}],patterns:[{id:"pattern",title:"滞在の記録が増えています",description:"画面検証用",confidence:0.6,relatedPlaceIds:[],relatedCategories:[],evidenceIds:["current:test"]}],changes:[],preferenceScores:[{axis:"longStay",score:55,confidence:0.5,reason:"画面検証用",evidenceIds:["current:test"]}],placeRelationships:[]};await route.fulfill({json:{...state,snapshots:[{id:"ui-test",userId:"A",generatedAt:new Date().toISOString(),result}]}});});
 await page.getByRole("button",{name:"最近の行動をAIで読み解く"}).click();await expect(page.getByRole("heading",{name:"街の休憩時間"})).toBeVisible();await expect(page.getByText("AIの解釈",{exact:false}).first()).toBeVisible();await page.screenshot({path:".local/personal-insights-mobile.png"});
 await page.getByRole("button",{name:"変化の記録"}).click();await expect(page.getByRole("heading",{name:"最近の変化"})).toBeVisible();
});
test("personal API rejects anonymous and actor overrides",async({request})=>{
 expect((await request.post("/api/personal",{data:{op:"state"}})).status()).toBe(403);
 await request.post("/api/v1/session",{data:{actor:"B"}});
 expect((await request.post("/api/personal",{data:{op:"state",userId:"A"}})).status()).toBe(400);
 const state=await(await request.post("/api/personal",{data:{op:"state"}})).json();expect(state.visits).toHaveLength(0);expect(state.snapshots).toHaveLength(0);
});


