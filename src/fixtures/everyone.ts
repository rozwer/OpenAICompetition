import type { FriendLens, LensPlace, LensVisit } from "../contracts/everyone";
export const lensPlaces: LensPlace[] = [
  { id:"cafe",name:"本山の喫茶店",area:"本山",category:"カフェ",lat:35.1635,lng:136.964,photo:"komeda_thumb.png" },
  { id:"books",name:"大須の古本屋",area:"大須",category:"書店",lat:35.160,lng:136.902,photo:"osu_bookstore_thumb.png" },
  { id:"park",name:"東山の公園",area:"本山",category:"自然",lat:35.1585,lng:136.973,photo:"higashiyama_park_thumb.png" },
  { id:"library",name:"大学周辺の図書館",area:"本山",category:"書店",lat:35.1549,lng:136.9668,photo:"osu_bookstore_thumb.png" },
  { id:"lunch",name:"栄の食堂",area:"栄",category:"グルメ",lat:35.169,lng:136.908,photo:"komeda_thumb.png" },
  { id:"music",name:"大須のライブスポット",area:"大須",category:"音楽",lat:35.158,lng:136.908,photo:"osu_bookstore_thumb.png" },
  { id:"garden",name:"鶴舞の緑道",area:"鶴舞",category:"自然",lat:35.1554,lng:136.9206,photo:"higashiyama_park_thumb.png" },
  { id:"bakery",name:"覚王山のベーカリー",area:"覚王山",category:"グルメ",lat:35.166,lng:136.952,photo:"komeda_thumb.png" },
];
const v=(placeId:string,count:number,minutes:number,context:string,meaning:string):LensVisit=>({placeId,count,minutes,context,meaning});
export const myLens:FriendLens={id:"you",name:"あなた",subtitle:"馴染みの場所で、自分の時間",areas:"本山・大須",recent:"本を読める喫茶店を見つけました",avatar:"mina.png",preview:"home_friend_preview_mina.png",visits:[v("cafe",12,91,"平日午後・ひとり","ひとりで読書や作業をする場所"),v("books",6,42,"休日午後・ひとり","次に読む本と出会う場所"),v("park",4,35,"平日夕方・ひとり","気分を切り替える散歩道"),v("library",10,105,"平日午前・ひとり","落ち着いて学ぶ場所")]};
export const friendLenses:FriendLens[]=[
 {id:"kaito",name:"Kaito",subtitle:"静かな喫茶店から、街を広げる",areas:"本山・覚王山・大須",recent:"大須の古本屋エリアを探索しました",avatar:"kaito_home.png",preview:"home_friend_preview_kaito.png",visits:[v("cafe",19,48,"休日午前・友人と","友人と朝食を食べる場所"),v("books",9,31,"平日夕方・ひとり","帰り道にふらっと立ち寄る場所"),v("park",7,52,"休日午後・友人と","友人とゆっくり話す場所"),v("bakery",5,24,"休日午前・ひとり","新しいパンを探す場所"),v("music",3,100,"休日夜・友人と","好きな音楽を楽しむ場所")]},
 {id:"yuki",name:"Yuki",subtitle:"おいしい寄り道を見つける人",areas:"栄・大須・覚王山",recent:"週末の食べ歩きコースを開拓しました",avatar:"yuki.png",preview:"home_friend_preview_yuki.png",visits:[v("lunch",11,44,"平日昼・友人と","友人とのランチの定番"),v("cafe",4,60,"休日午後・友人と","食べ歩きの休憩場所"),v("bakery",8,22,"休日午前・ひとり","朝の楽しみを見つける場所")]},
 {id:"ryo",name:"Ryo",subtitle:"緑と光を探して歩く",areas:"本山・鶴舞",recent:"夕方の緑道で、いい光に出会いました",avatar:"ryo.png",preview:"home_friend_preview_ryo.png",visits:[v("park",14,64,"休日夕方・ひとり","木漏れ日を撮る場所"),v("garden",9,55,"平日夕方・ひとり","走ってリフレッシュする場所")]},
 {id:"mina",name:"Mina",subtitle:"本とコーヒーのある街",areas:"本山・大須",recent:"読書のあとに立ち寄るカフェを発見",avatar:"mina.png",preview:"home_friend_preview_mina.png",visits:[v("cafe",8,88,"平日午後・ひとり","本の続きを読む場所"),v("books",12,50,"休日午後・ひとり","新しい物語を探す場所"),v("library",7,120,"平日午前・ひとり","集中する時間をつくる場所")]},
];
