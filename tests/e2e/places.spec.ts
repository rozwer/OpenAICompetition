import { test, expect } from "@playwright/test";
test("mobile semantic places show genuine cached POIs, details and safe fetch failure",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");await page.getByRole("button",{name:"利用者 A で始める"}).click();await page.getByRole("button",{name:"地図をひらく"}).click();
 await page.getByRole("button",{name:"行き先をAIと探す"}).click();await page.getByRole("button",{name:/周辺の場所/}).click();
 const dialog=page.locator(".poi-dialog");await expect(dialog).toBeVisible();
 await expect(dialog.locator(".poi-list button").first()).toBeVisible();
 await expect(dialog.getByText(/取得日 2026-09-07/)).toBeVisible();
 await dialog.locator(".poi-list button").first().click();
 await expect(dialog.getByText("カテゴリ",{exact:true})).toBeVisible();await expect(dialog.getByText("データソース",{exact:true})).toBeVisible();
 await expect(dialog.getByRole("link",{name:"OpenStreetMapで詳細を見る"})).toHaveAttribute("href",/^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/);
 await page.screenshot({path:".local/semantic-poi-details-mobile.png"});
 await dialog.getByRole("button",{name:"一覧に戻る"}).click();
 page.once("dialog",async confirm=>{expect(confirm.message()).toContain("Overpass");await confirm.accept();});
 await page.route("**/api/places",async route=>{const body=route.request().postDataJSON();if(body.network){expect(body.approve).toBe(true);await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"テスト: 地理情報サービスに接続できません"})});}else await route.continue();});
 await dialog.getByRole("button",{name:"この周辺を更新"}).click();await expect(dialog.getByRole("alert")).toContainText("接続できません");await expect(dialog.locator(".poi-list button").first()).toBeVisible();
 await dialog.getByRole("button",{name:"周辺情報を閉じる"}).click();await expect(page.locator(".maplibregl-canvas")).toBeVisible();await page.screenshot({path:".local/semantic-pois-mobile.png"});
});
test("places endpoint enforces session",async({request})=>{
 const response=await request.post("/api/places",{data:{lat:35,lng:136,radius:1000}});expect(response.status()).toBe(403);
});

