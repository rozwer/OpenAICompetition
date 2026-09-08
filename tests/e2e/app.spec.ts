import { test, expect } from "@playwright/test";
test("home explore button directly enters and leaves the immersive world on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page.getByRole("button", { name: "地図をひらく" }).click();
  const canvas = page.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ホームに戻る" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#explore$/);
  const full = await page.locator(".map-region").boundingBox();
  expect(full?.width).toBe(390);
  expect(full?.height).toBe(844);
  await expect(page.getByRole("img", { name: "自分のアバター" })).toBeVisible();
  await expect(page.getByText("デモのスタート地点 · 半径20m")).toBeVisible();
  await page.waitForTimeout(1300);
  const beforeRotation = await canvas.screenshot();
  await expect(
    page.getByRole("button", { name: "自分を中心に右へ回転" }),
  ).toHaveCount(0);
  await page.mouse.move(230, 390);
  await page.mouse.down();
  await page.mouse.move(330, 390, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(650);
  expect((await canvas.screenshot()).equals(beforeRotation)).toBe(false);
  const avatar = await page
    .getByRole("img", { name: "自分のアバター" })
    .boundingBox();
  expect(avatar!.x + avatar!.width / 2).toBeCloseTo(195, -1);
  expect(avatar!.y + avatar!.height).toBeGreaterThan(844 * 0.55);
  expect(avatar!.y + avatar!.height).toBeLessThan(844 * 0.7);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  // A complete finger circle must produce a complete map revolution,
  // including crossing atan2's -180/180 boundary in either direction.
  const compass = page.locator(
    ".maplibregl-ctrl-compass .maplibregl-ctrl-icon",
  );
  const compassAngle = () =>
    compass.evaluate((el) => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    });
  const turnDelta = (a: number, b: number) =>
    (Math.atan2(
      Math.sin(((b - a) * Math.PI) / 180),
      Math.cos(((b - a) * Math.PI) / 180),
    ) *
      180) /
    Math.PI;
  const cx = avatar!.x + avatar!.width / 2,
    cy = avatar!.y + avatar!.height;
  for (const direction of [1, -1]) {
    let previous = await compassAngle(),
      total = 0;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: cx + 95, y: cy }],
    });
    for (let step = 1; step <= 32; step++) {
      const angle = (direction * step * Math.PI) / 16;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: cx + 95 * Math.cos(angle), y: cy + 95 * Math.sin(angle) },
        ],
      });
      const current = await compassAngle();
      total += turnDelta(previous, current);
      previous = current;
      if (step % 8 === 0)
        expect(total).toBeCloseTo(direction * step * 11.25, 0);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  const beforeTouch = await canvas.screenshot();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 110, y: 380 }],
  });
  for (let x = 130; x <= 290; x += 20)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: 380 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(beforeTouch)).toBe(false);
  const afterTouch = await page
    .getByRole("img", { name: "自分のアバター" })
    .boundingBox();
  expect(afterTouch!.x).toBeCloseTo(avatar!.x, 0);
  expect(afterTouch!.y).toBeCloseTo(avatar!.y, 0);
  await expect(page.locator(".maplibregl-popup")).toHaveCount(0);
  const beforePinch = await canvas.screenshot();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 150, y: 380, id: 1 },
      { x: 230, y: 380, id: 2 },
    ],
  });
  for (let d = 10; d <= 60; d += 10)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: 150 - d, y: 380, id: 1 },
        { x: 230 + d, y: 380, id: 2 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(500);
  expect((await canvas.screenshot()).equals(beforePinch)).toBe(false);
  const afterPinch = await page
    .getByRole("img", { name: "自分のアバター" })
    .boundingBox();
  expect(afterPinch!.x).toBeCloseTo(avatar!.x, 0);
  expect(afterPinch!.y).toBeCloseTo(avatar!.y, 0);
  await cdp.detach();
  await page.getByRole("button", { name: "地図と話す" }).click();
  await expect(
    page.getByRole("textbox", { name: "メッセージ", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ホーム", exact: true }).click();
  await expect(page.locator(".app")).not.toHaveClass(/exploring/);
  await expect(
    page.getByRole("button", { name: "地図をひらく" }),
  ).toBeVisible();
});
test("replay, persist, invite and approve in separate sessions", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await expect(page.getByText("名古屋を歩こう", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "久屋大通公園", exact: true }),
  ).toBeVisible();
  const canvas = await page.locator(".map-canvas").boundingBox();
  expect(canvas?.height).toBeGreaterThan(300);
  await page.getByRole("button", { name: "散歩を再生" }).click();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "一時停止" }).click();
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/v1/state");
      return (await res.json()).points.length;
    })
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "つながる", exact: true }).click();
  await page
    .getByRole("textbox", { name: "友人の招待コード" })
    .fill("NAGOYA-B");
  await page.getByRole("button", { name: "申請", exact: true }).click();
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "利用者 B で始める" }).click();
  await other.getByRole("button", { name: "つながる", exact: true }).click();
  const approve = other.getByRole("button", { name: "承認", exact: true });
  if (await approve.count()) await approve.click();
  await expect(other.getByText("友人になりました")).toBeVisible();
  expect(
    (await (await other.request.get("/api/v1/state")).json()).points,
  ).toHaveLength(0);
  await ctx.close();
});

test("requires a session and rejects cross-origin writes", async ({ page }) => {
  const unauthenticated = await page.request.get("/api/v1/state");
  expect(unauthenticated.status()).toBe(401);
  const crossOrigin = await page.request.post("/api/v1/session", {
    headers: { Origin: "https://unrelated.example" },
    data: { actor: "A" },
  });
  expect(crossOrigin.status()).toBe(403);
});
test("mobile layout supports text entry without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await page.getByRole("button", { name: "地図と話す" }).click();
  await page
    .getByRole("textbox", { name: "メッセージ", exact: true })
    .fill("海のそばで過ごすのが好き");
  await expect(
    page.getByRole("button", { name: "送信", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("type diagnosis shows unknown axes without editing or fake replay evidence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 B で始める" }).click();
  await page.getByRole("button", { name: "アプリを育てる" }).click();
  await page.getByRole("button", { name: "タイプ診断", exact: true }).click();
  await expect(page.getByRole("heading", { name: "タイプ診断" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: /好みのレーダーチャート/ }),
  ).toBeVisible();
  await expect(page.getByText("会話と滞在記録から診断しています…")).toHaveCount(
    0,
  );
  await expect(page.locator(".diagnosis-reasons details")).toHaveCount(6);
  await expect(page.getByRole("textbox", { name: "記憶を訂正" })).toHaveCount(
    0,
  );
  const result = await page.request.post("/api/v1/diagnosis", { data: {} });
  expect(result.ok()).toBe(true);
  expect(
    (await result.json()).axes.every(
      (a: { score: number | null }) => a.score === null,
    ),
  ).toBe(true);
  await page.locator(".diagnosis-reasons summary").first().click();
  await expect(
    page.getByText("判断できる記録がまだありません。").first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("diagnosis renders a complete radar and source details", async ({
  page,
}) => {
  const ids = ["curiosity", "nature", "culture", "food", "social", "activity"];
  await page.route("**/api/v1/diagnosis", (route) =>
    route.fulfill({
      json: {
        axes: ids.map((id, i) => ({
          id,
          score: [80, 90, 60, 35, 65, 75][i],
          reason: "画面検証用の推定理由です。",
          evidenceIds: ["test"],
        })),
        updatedAt: "2026-09-05T12:00:00Z",
        evidence: [
          { id: "test", kind: "conversation", text: "画面検証用の会話です。" },
        ],
      },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 B で始める" }).click();
  await page.getByRole("button", { name: "アプリを育てる" }).click();
  await page.getByRole("button", { name: "タイプ診断", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /6項目を推定済み/ }),
  ).toBeVisible();
  await expect(page.locator(".diagnosis-chart polygon")).toHaveCount(5);
  await page.locator(".diagnosis-reasons summary").first().click();
  await expect(page.getByText("画面検証用の会話です。").first()).toBeVisible();
  await page.screenshot({ path: ".local/diagnosis-mobile.png" });
});

test("conversation opens route planning, preserves required stops and distinguishes missing-key proposals", async ({
  page,
}) => {
  const { places } = await import("../../src/fixtures/nagoya");
  let requestBody: any;
  await page.route("**/api/v1/route", (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      json: {
        id: "current",
        request: requestBody,
        fingerprint: "test",
        start: places[1],
        end: places[0],
        stops: [
          {
            place: places[2],
            reason: "水辺が好きという会話から（画面テスト）",
          },
        ],
        explanation: "テスト用の経由地提案",
        status: "needs-key",
        route: null,
        createdAt: new Date().toISOString(),
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 B で始める" }).click();
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await page.getByRole("button", { name: "地図と話す", exact: true }).click();
  await page
    .getByRole("button", { name: "この会話から散歩ルートを作る" })
    .click();
  await expect(
    page.getByRole("heading", { name: "どこへ行こう？" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /出発地・目的地・経由地を指定する/ })
    .click();
  await page.getByRole("checkbox", { name: "大須観音" }).check();
  await page
    .getByRole("button", { name: /この条件でルートを提案してもらう/ })
    .click();
  await expect(
    page.getByText(/徒歩経路の取得にはサーバーのORS_API_KEY/),
  ).toBeVisible();
  expect(requestBody.via).toEqual(["osu"]);
  expect(requestBody.preference).toContain("気分: のんびり");
  await expect(
    page.getByRole("button", { name: "地図でルートを見る" }),
  ).toHaveCount(0);
  await page.screenshot({ path: ".local/route-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("exploration card opens the live map and renders the proposed route in place", async ({
  page,
}) => {
  const { places } = await import("../../src/fixtures/nagoya");
  await page.route("**/api/v1/route", (request) =>
    request.fulfill({
      json: {
        id: "map-preview",
        request: request.request().postDataJSON(),
        fingerprint: "map-preview",
        start: places[1],
        end: places[0],
        stops: [{ place: places[2], reason: "気分に合う立ち寄り先です。" }],
        explanation: "名古屋の街をゆっくり巡るルートです。",
        status: "ready",
        route: {
          geometry: {
            type: "LineString",
            coordinates: [
              [places[1].lng, places[1].lat],
              [places[2].lng, places[2].lat],
              [places[0].lng, places[0].lat],
            ],
          },
          distance: 2800,
          duration: 2100,
        },
        createdAt: new Date().toISOString(),
      },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page
    .getByRole("navigation", { name: "ホームナビゲーション" })
    .getByRole("button", { name: "地図を育てる", exact: true })
    .click();
  await page.getByRole("button", { name: /探索モード/ }).click();
  await expect(page.getByLabel("名古屋の3D地図")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "どこへ行こう？" }),
  ).toBeVisible();
  await page.getByLabel("希望するまち歩き").fill("緑とカフェを巡りたい");
  await page.getByRole("button", { name: "希望から提案する" }).click();
  await expect(page.getByText("AI提案ルートを地図に表示中")).toBeVisible();
  await expect(page.getByLabel("名古屋の3D地図")).toHaveAttribute(
    "data-route-visible",
    "true",
  );
  await page
    .getByRole("button", { name: "このルートで地図の世界に入る" })
    .click();
  await expect(page.locator(".app")).toHaveClass(/exploring/);
  await expect(page.getByLabel("名古屋の3D地図")).toHaveAttribute(
    "data-route-visible",
    "true",
  );
  await page.screenshot({ path: ".local/explore-route-map-mobile.png" });
});

test("walking replay grows decorated buildings and preserves orbit controls", async ({
  page,
}) => {
  const { demoTrack } = await import("../../src/fixtures/nagoya");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await expect
    .poll(async () => (await page.request.get("/api/v1/state")).status())
    .toBe(200);
  const seeded = await page.request.post("/api/v1/points", {
    data: { points: demoTrack() },
  });
  expect(seeded.ok()).toBe(true);
  await page.goto("/");
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await expect(page.getByRole("img", { name: "自分のアバター" })).toBeVisible();
  await page.waitForTimeout(2200);
  await expect(page.locator(".map-error")).toHaveCount(0);
  const feet = await page
    .getByRole("img", { name: "自分のアバター" })
    .boundingBox();
  expect(feet!.x + feet!.width / 2).toBeCloseTo(195, 0);
  expect(feet!.y + feet!.height).toBeCloseTo(844 * 0.62, 0);
  await page.screenshot({ path: ".local/buildings-mobile.png" });
});

test("device GPS moves the walker to Nagoya University and shows its reading", async ({
  page,
}) => {
  await page.context().grantPermissions(["geolocation"], {
    origin: "http://127.0.0.1:3001",
  });
  await page.context().setGeolocation({
    latitude: 35.1533087,
    longitude: 136.9677806,
    accuracy: 12,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await page.getByRole("button", { name: "現在地を記録" }).click();
  await expect(page.getByText(/現在地 35\.15331, 136\.96778/)).toBeVisible();
  await expect(page.getByText(/精度 約12m/)).toBeVisible();
  await expect(page.getByText("最後に取得したGPS位置 · 半径20m")).toBeVisible();
  const state = await page.request.get("/api/v1/state");
  const snapshot = await state.json();
  expect(
    snapshot.points.some((p: { origin: string }) => p.origin === "device"),
  ).toBe(true);
  await page.screenshot({ path: ".local/gps-nagoya-university.png" });
  await page.getByRole("button", { name: "位置記録を停止" }).click();
});

test("illustrated home and action navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await expect(
    page.getByRole("button", { name: "地図をひらく" }),
  ).toBeVisible();
  await expect(page.getByLabel("あなたの記録")).toContainText("記録した距離");
  await expect(page.locator(".home-art")).toHaveCSS(
    "background-image",
    /home-coast/,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: ".local/home-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: ".local/home-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "地図をひらく" }).click();
  await expect(page.getByText("名古屋を歩こう", { exact: true })).toBeVisible();
});

test("bottom map opens the illustrated destination menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page
    .getByRole("navigation", { name: "ホームナビゲーション" })
    .getByRole("button", { name: "地図を育てる", exact: true })
    .click();
  await expect(page.getByLabel("地図メニュー", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "これまでの軌跡（準備中）" }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/#maps$/);
  await expect(
    page.getByRole("button", { name: "地図を育てる", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.screenshot({ path: ".local/map-menu-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.reload();
  await expect(page.getByLabel("地図メニュー", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /探索モード/ }).click();
  await expect(
    page.getByRole("heading", { name: "どこへ行こう？" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "のんびり" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.screenshot({
    path: ".local/explore-planner-mobile.png",
    fullPage: true,
  });
  await page.goto("/#maps");
  await page.getByRole("button", { name: /みんなの地図/ }).click();
  await expect(page.getByLabel("友人の招待コード")).toBeVisible();
  await page.goto("/#maps");
  await page.getByRole("button", { name: "ホーム", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "地図をひらく" }),
  ).toBeVisible();
});

test("grow apps catalog filters ideas and preserves a draft without claiming generation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "利用者 A で始める" }).click();
  await page.getByRole("button", { name: "アプリを育てる", exact: true }).click();
  await expect(page.getByRole("heading", { name: "アプリを育てる。" })).toBeVisible();
  await expect(page.locator(".app-global-nav button")).toHaveCount(4);
  await page.screenshot({ path: ".local/grow-apps-mobile.png" });
  await page.getByRole("textbox", { name: "機能を検索" }).fill("夕日");
  await expect(page.locator(".grow-list-item")).toHaveCount(1);
  await page.getByRole("button", { name: "自分で機能を作ってみる" }).click();
  await page.getByRole("textbox", { name: "作りたい機能" }).fill("歩いた道で陣取りゲームを作りたい");
  await page.getByRole("button", { name: "アイデアを下書き保存" }).click();
  await expect(page.getByRole("status")).toContainText("このブラウザに保存しました");
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "自分で機能を作ってみる" }).click();
  await expect(page.getByRole("textbox", { name: "作りたい機能" })).toHaveValue("歩いた道で陣取りゲームを作りたい");
  await expect(page.getByText("AIによる機能生成は準備中です。", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: "戻る", exact: true }).click();
  await expect(page.getByRole("button", { name: "地図をひらく" })).toBeVisible();
});
