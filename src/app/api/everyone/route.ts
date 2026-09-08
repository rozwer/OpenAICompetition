import { NextRequest, NextResponse } from "next/server";
import { actorFrom, sameOrigin } from "../../../server/session";
import { CodexAI } from "../../../infrastructure/codex";
import { comparisonInput } from "../../../domain/everyone";
import { friendLenses, myLens } from "../../../fixtures/everyone";
import { z } from "zod";
export const runtime="nodejs";
export const maxDuration=120;
const pending=new Set<string>(), last=new Map<string,number>();
export async function POST(req:NextRequest){
 const actor=actorFrom(req);if(!actor||!sameOrigin(req))return NextResponse.json({error:"利用者を確認してください"},{status:403});
 let friend;try{const raw=await req.text();if(raw.length>200)throw Error();const data=z.object({friendId:z.string().max(30)}).strict().parse(JSON.parse(raw));friend=friendLenses.find(f=>f.id===data.friendId);if(!friend)throw Error()}catch{return NextResponse.json({error:"友人を選び直してください"},{status:400})}
 if(pending.has(actor)||pending.size>=2||Date.now()-(last.get(actor)||0)<30000)return NextResponse.json({error:"少し待ってから再試行してください"},{status:429});
 pending.add(actor);last.set(actor,Date.now());
 try{return NextResponse.json(await new CodexAI().compareLenses(comparisonInput(myLens,friend)),{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"AIの比較を取得できませんでした。ローカルCodexの接続を確認して再試行してください。"},{status:503})}finally{pending.delete(actor)}
}
