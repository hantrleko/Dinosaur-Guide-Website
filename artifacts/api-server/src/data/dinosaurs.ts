export type Era = "三叠纪" | "侏罗纪" | "白垩纪";
export type Diet = "肉食" | "草食" | "杂食";

export interface Dinosaur {
  id: string;
  nameCn: string;
  nameLatin: string;
  era: Era;
  diet: Diet;
  lengthM: number;
  weightTons: number;
  region: string;
  description: string;
  funFact: string;
  imageUrl: string;
}

export const dinosaurs: Dinosaur[] = [
  {
    id: "tyrannosaurus-rex",
    nameCn: "霸王龙",
    nameLatin: "Tyrannosaurus rex",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 12.3,
    weightTons: 8.4,
    region: "北美洲",
    description: "霸王龙是史上最庞大且最著名的肉食性恐龙之一。它们拥有极其强大的咬合力，能够轻易咬碎猎物的骨头。前肢虽然短小，但依然具备强大的力量。",
    funFact: "霸王龙的咬合力可达6吨，相当于一头大象的重量！",
    imageUrl: "/dinos/tyrannosaurus-rex.png"
  },
  {
    id: "velociraptor",
    nameCn: "迅猛龙",
    nameLatin: "Velociraptor",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 2.0,
    weightTons: 0.015,
    region: "亚洲",
    description: "迅猛龙是一种小型而敏捷的驰龙类恐龙。它们大脑发达，视觉锐利，后肢的第二趾上长有一个像镰刀一样的大爪子，用于捕杀猎物。",
    funFact: "真实的迅猛龙体型只有火鸡大小，且全身覆盖着羽毛。",
    imageUrl: "/dinos/velociraptor.png"
  },
  {
    id: "brachiosaurus",
    nameCn: "腕龙",
    nameLatin: "Brachiosaurus",
    era: "侏罗纪",
    diet: "草食",
    lengthM: 26,
    weightTons: 40,
    region: "北美洲",
    description: "腕龙是巨大的蜥脚类恐龙，其最显著的特征是前肢比后肢长。它们长长的脖子使它们能够吃到高树上的针叶，就像现代的长颈鹿一样。",
    funFact: "腕龙一天可能需要吃掉超过400公斤的植物！",
    imageUrl: "/dinos/brachiosaurus.png"
  },
  {
    id: "triceratops",
    nameCn: "三角龙",
    nameLatin: "Triceratops",
    era: "白垩纪",
    diet: "草食",
    lengthM: 9.0,
    weightTons: 12,
    region: "北美洲",
    description: "三角龙是最大的角龙类恐龙，头部有三根长角和一个坚固的颈盾。这些特征主要用于防御顶级掠食者的攻击，也可能用于求偶展示。",
    funFact: "三角龙的头骨是已知陆地动物中最大的，几乎占据了体长的三分之一。",
    imageUrl: "/dinos/triceratops.png"
  },
  {
    id: "stegosaurus",
    nameCn: "剑龙",
    nameLatin: "Stegosaurus",
    era: "侏罗纪",
    diet: "草食",
    lengthM: 9.0,
    weightTons: 5.3,
    region: "北美洲",
    description: "剑龙因其背上一排巨大的骨板和尾部的四根尖刺而闻名。虽然体型巨大，但它们的头部非常小，大脑容量仅相当于一个核桃。",
    funFact: "剑龙尾部的尖刺在古生物学中被称为“Thagomizer”，这个名字来源于一部漫画。",
    imageUrl: "/dinos/stegosaurus.png"
  },
  {
    id: "ankylosaurus",
    nameCn: "甲龙",
    nameLatin: "Ankylosaurus",
    era: "白垩纪",
    diet: "草食",
    lengthM: 8.0,
    weightTons: 6,
    region: "北美洲",
    description: "甲龙就像一辆活生生的坦克，背部覆盖着厚重的骨甲和尖刺。它们的尾巴末端有一个巨大的骨锤，是极其致命的防御武器。",
    funFact: "甲龙的眼睑也是由骨头构成的，能够完全保护眼睛。",
    imageUrl: "/dinos/ankylosaurus.png"
  },
  {
    id: "parasaurolophus",
    nameCn: "副栉龙",
    nameLatin: "Parasaurolophus",
    era: "白垩纪",
    diet: "草食",
    lengthM: 10.0,
    weightTons: 2.5,
    region: "北美洲",
    description: "副栉龙属于鸭嘴龙类，头上长有一个长长的中空冠饰。科学家认为这个冠饰被用来发出响亮的声音，以便在同类之间进行长距离交流。",
    funFact: "副栉龙的头冠内部有一条复杂的管道，可以像长号一样放大声音。",
    imageUrl: "/dinos/parasaurolophus.png"
  },
  {
    id: "pteranodon",
    nameCn: "翼龙",
    nameLatin: "Pteranodon",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 6.0,
    weightTons: 0.05,
    region: "北美洲",
    description: "翼龙不是真正的恐龙，而是与恐龙生活在同一时期的飞行爬行动物。它们拥有巨大的翼展和尖锐的无齿喙，主要以海洋中的鱼类为食。",
    funFact: "翼龙虽然没有牙齿，但它们能在飞行中精准地俯冲入水捕鱼。",
    imageUrl: "/dinos/pteranodon.png"
  },
  {
    id: "mosasaurus",
    nameCn: "沧龙",
    nameLatin: "Mosasaurus",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 15.0,
    weightTons: 15,
    region: "欧洲、北美洲",
    description: "沧龙是白垩纪晚期的海洋霸主，属于巨大的海生爬行动物。它们拥有流线型的身体、强壮的桨状肢和布满利齿的巨大双颚。",
    funFact: "沧龙的下颌有一组额外的牙齿，可以确保咬住的猎物无法逃脱。",
    imageUrl: "/dinos/mosasaurus.png"
  },
  {
    id: "ichthyosaurus",
    nameCn: "鱼龙",
    nameLatin: "Ichthyosaurus",
    era: "侏罗纪",
    diet: "肉食",
    lengthM: 3.3,
    weightTons: 0.1,
    region: "欧洲",
    description: "鱼龙是一类高度适应水生生活的爬行动物，外形非常像现代的海豚。它们有着流线型的身体和巨大的眼睛，适合在深海中捕猎。",
    funFact: "鱼龙的眼睛是所有脊椎动物中最大的之一，有助于在深海的暗处看清猎物。",
    imageUrl: "/dinos/ichthyosaurus.png"
  },
  {
    id: "iguanodon",
    nameCn: "禽龙",
    nameLatin: "Iguanodon",
    era: "白垩纪",
    diet: "草食",
    lengthM: 10.0,
    weightTons: 3.0,
    region: "欧洲",
    description: "禽龙是最早被人类发现并命名的恐龙之一。它们有一个特别的圆锥状拇指指刺，可能用于防御掠食者或剥取植物。",
    funFact: "早期科学家曾错误地将禽龙的拇指刺安在它的鼻子上，认为那是角。",
    imageUrl: "/dinos/iguanodon.png"
  },
  {
    id: "spinosaurus",
    nameCn: "棘龙",
    nameLatin: "Spinosaurus",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 15.0,
    weightTons: 7.0,
    region: "非洲",
    description: "棘龙是已知体型最大的肉食性恐龙，比霸王龙还要长。背上有一个巨大的帆状物，并且拥有类似鳄鱼的长吻，高度适应半水生生活。",
    funFact: "棘龙是目前已知唯一能在水中自如游动的大型肉食性恐龙。",
    imageUrl: "/dinos/spinosaurus.png"
  },
  {
    id: "allosaurus",
    nameCn: "异特龙",
    nameLatin: "Allosaurus",
    era: "侏罗纪",
    diet: "肉食",
    lengthM: 9.7,
    weightTons: 2.3,
    region: "北美洲",
    description: "异特龙是侏罗纪晚期最庞大和常见的肉食性恐龙。它们的头骨较大，拥有像锯齿一样锐利的牙齿和强壮的前肢，是凶猛的掠食者。",
    funFact: "异特龙在捕猎时可能会像使用斧头一样挥动它的头部来砍杀猎物。",
    imageUrl: "/dinos/allosaurus.png"
  },
  {
    id: "diplodocus",
    nameCn: "梁龙",
    nameLatin: "Diplodocus",
    era: "侏罗纪",
    diet: "草食",
    lengthM: 27.0,
    weightTons: 15,
    region: "北美洲",
    description: "梁龙因其极长的脖子和呈鞭状的尾巴而易于辨认。它们的身体相对轻盈，重心位于骨盆，能够用后肢站立起来吃到高处的植物。",
    funFact: "梁龙的尾巴末端可以像鞭子一样挥动，产生震耳欲聋的音爆声来吓退敌人。",
    imageUrl: "/dinos/diplodocus.png"
  },
  {
    id: "pachycephalosaurus",
    nameCn: "肿头龙",
    nameLatin: "Pachycephalosaurus",
    era: "白垩纪",
    diet: "草食",
    lengthM: 4.5,
    weightTons: 0.45,
    region: "北美洲",
    description: "肿头龙的头顶上有一块极厚的圆顶状骨骼，厚度可达25厘米。科学家认为它们会像现代的大角羊一样，用头骨互相撞击来争夺领地或配偶。",
    funFact: "尽管头盖骨极厚，但肿头龙的大脑依然非常小。",
    imageUrl: "/dinos/pachycephalosaurus.png"
  },
  {
    id: "mamenchisaurus",
    nameCn: "马门溪龙",
    nameLatin: "Mamenchisaurus",
    era: "侏罗纪",
    diet: "草食",
    lengthM: 22.0,
    weightTons: 20,
    region: "亚洲",
    description: "马门溪龙是中国发现的最著名的恐龙之一，以其长得不可思议的脖子而著称，颈部长度占了体长的一半，由多达19节颈椎组成。",
    funFact: "马门溪龙的脖子是所有已知恐龙中最长的。",
    imageUrl: "/dinos/mamenchisaurus.png"
  },
  {
    id: "protoceratops",
    nameCn: "原角龙",
    nameLatin: "Protoceratops",
    era: "白垩纪",
    diet: "草食",
    lengthM: 1.8,
    weightTons: 0.18,
    region: "亚洲",
    description: "原角龙是生活在戈壁沙漠中的小型角龙。它们没有真正的角，但有一个宽大的骨质颈盾，经常成群活动以抵御迅猛龙等捕食者。",
    funFact: "古生物学家发现过一具原角龙与迅猛龙正在殊死搏斗的化石化骨架。",
    imageUrl: "/dinos/protoceratops.png"
  },
  {
    id: "ornithomimus",
    nameCn: "似鸟龙",
    nameLatin: "Ornithomimus",
    era: "白垩纪",
    diet: "杂食",
    lengthM: 3.8,
    weightTons: 0.17,
    region: "北美洲",
    description: "似鸟龙外形酷似现代的鸵鸟，拥有极长的腿、轻盈的身体和无齿的喙。它们是奔跑速度最快的恐龙之一。",
    funFact: "似鸟龙的奔跑速度可能达到每小时80公里，与现代的鸵鸟不相上下。",
    imageUrl: "/dinos/ornithomimus.png"
  },
  {
    id: "ceratosaurus",
    nameCn: "角鼻龙",
    nameLatin: "Ceratosaurus",
    era: "侏罗纪",
    diet: "肉食",
    lengthM: 6.0,
    weightTons: 1.0,
    region: "北美洲",
    description: "角鼻龙是一种中等体型的兽脚类恐龙，其最显著的特征是鼻端有一个醒目的骨质角，且背部有一排小型的皮内成骨。",
    funFact: "角鼻龙的牙齿异常巨大，甚至长过异特龙，非常适合撕裂大型猎物。",
    imageUrl: "/dinos/ceratosaurus.png"
  },
  {
    id: "giganotosaurus",
    nameCn: "南方巨兽龙",
    nameLatin: "Giganotosaurus",
    era: "白垩纪",
    diet: "肉食",
    lengthM: 13.0,
    weightTons: 8.0,
    region: "南美洲",
    description: "南方巨兽龙是已知体型最大的陆地肉食性动物之一，体型甚至可能超过霸王龙。它们拥有巨大的头骨和刀片状的牙齿，专为切肉而生。",
    funFact: "科学家推测南方巨兽龙可能会结群捕猎当时地球上最大的动物——阿根廷龙。",
    imageUrl: "/dinos/giganotosaurus.png"
  }
];
