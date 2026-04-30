import os
import time

try:
    from google import genai
except ImportError:
    print("請先安裝 google-genai 套件: pip install google-genai")
    genai = None

# 資料定義
CRITERIA = [
    {'id': 'interests', 'label': '興趣與熱情', 'desc': '你平常喜歡做什麼？做什麼事會讓你忘記時間？'},
    {'id': 'abilities', 'label': '能力與優勢', 'desc': '你擅長什麼？什麼科目或事情你學得特別快？'},
    {'id': 'value', 'label': '未來價值觀', 'desc': '你希望未來的生活是什麼樣子？看重什麼？'},
    {'id': 'reality', 'label': '現實考量', 'desc': '分數、家人期待、未來出路等實際問題。'}
]

DISCOVERY_ITEMS = [
    # 興趣與熱情
    {'id': 'i1', 'category': 'interests', 'label': '喜歡動手做/做實驗'},
    {'id': 'i2', 'category': 'interests', 'label': '熱愛看書、寫作或討論'},
    {'id': 'i3', 'category': 'interests', 'label': '對數字、圖表很敏感'},
    {'id': 'i4', 'category': 'interests', 'label': '喜歡跟人講話、辦活動'},
    {'id': 'i5', 'category': 'interests', 'label': '對美的事物、設計著迷'},
    # 能力與優勢
    {'id': 'a1', 'category': 'abilities', 'label': '記憶力超強，背東西很快'},
    {'id': 'a2', 'category': 'abilities', 'label': '邏輯推理很順，喜歡解謎'},
    {'id': 'a3', 'category': 'abilities', 'label': '說服力滿點，能帶領團隊'},
    {'id': 'a4', 'category': 'abilities', 'label': '擅長發現並解決實際問題'},
    {'id': 'a5', 'category': 'abilities', 'label': '語文能力好，學習新語言快'},
    # 未來價值觀
    {'id': 'v1', 'category': 'value', 'label': '想要未來能賺大錢'},
    {'id': 'v2', 'category': 'value', 'label': '想要改變世界、發揮影響力'},
    {'id': 'v3', 'category': 'value', 'label': '追求安穩、有保障的生活'},
    {'id': 'v4', 'category': 'value', 'label': '工作時間想要自由彈性'},
    {'id': 'v5', 'category': 'value', 'label': '重視團隊合作與人際關係'},
    # 現實考量
    {'id': 'r1', 'category': 'reality', 'label': '家人的期望或建議'},
    {'id': 'r2', 'category': 'reality', 'label': '未來好不好找工作'},
    {'id': 'r3', 'category': 'reality', 'label': '目前成績與分數的限制'},
    {'id': 'r4', 'category': 'reality', 'label': '學費負擔與獎學金機會'},
    {'id': 'r5', 'category': 'reality', 'label': '高中學校資源與距離'}
]

TRACKS = ['文史', '商管', '理工', '生醫']

TRACK_DETAILS = {
  '文史': { 'desc': '對文字、美感、搞創作有熱忱的你，或是腦袋裡總裝著各種天馬行空點子的同學。' },
  '商管': { 'desc': '喜歡跟人交流、對社會議題有感、擅長表達想法或是喜歡當大家傾聽者的你。' },
  '理工': { 'desc': '腦袋裝著各種邏輯、喜歡動手做實驗、寫程式打怪，對解決大問題很感興趣的你。' },
  '生醫': { 'desc': '對生命科學好奇、想了解人體奧秘，或者懷抱著救人助人熱血理念的你。' }
}

def main():
    print("="*50)
    print(" 歡迎來到生涯藍圖建構系統 - 決策平衡單 (Python 終端出版) ")
    print("="*50)
    print("\n選班群不是決定人生的終點，而是建構你生涯藍圖的第一個重要起點！\n")
    
    selected_items = []
    
    # Step 1: 盤點素材
    print("【第一步：盤點生涯建構的素材】")
    for category in CRITERIA:
        print(f"\n--- {category['label']} ---")
        items = [item for item in DISCOVERY_ITEMS if item['category'] == category['id']]
        for idx, item in enumerate(items, 1):
            print(f"{idx}. {item['label']}")
        
        choices = input(f"請輸入你最在意的選項編號 (例如 '1 3'，不選請直接 Enter): ")
        if choices.strip():
            try:
                indices = [int(i)-1 for i in choices.split()]
                for idx in indices:
                    if 0 <= idx < len(items):
                        selected_items.append(items[idx])
            except ValueError:
                pass

    # Step 2: 權重設定
    print("\n" + "="*50)
    print("【第二步：確立生涯價值觀的優先序】")
    print("在建構未來的過程中，哪些素材對你而言最不可或缺？給予權重吧 (1-10分)！")
    
    weights = {}
    for category in CRITERIA:
        cat_items = [i['label'] for i in selected_items if i['category'] == category['id']]
        print(f"\n{category['label']} - {category['desc']}")
        if cat_items:
            print(f"你選擇了重點：{', '.join(cat_items)}")
        else:
            print("你未選擇具體重點，憑直覺評分即可。")
        
        while True:
            try:
                w = int(input(f"請輸入權重 (1-10): "))
                if 1 <= w <= 10:
                    weights[category['id']] = w
                    break
                else:
                    print("請輸入 1 到 10 之間的數字。")
            except ValueError:
                print("請輸入有效的數字。")

    # Step 3: 各班群適配性評測
    print("\n" + "="*50)
    print("【第三步：模擬環境：我的價值觀能被實踐嗎？】")
    print("想像進入該班群後你的生活樣貌，這些你重視的價值能在那被滿足幾分？(1-10分)")
    
    scores = {c['id']: {t: 5 for t in TRACKS} for c in CRITERIA}
    
    for category in CRITERIA:
        print(f"\n--- 針對【{category['label']}】的評分 ---")
        for track in TRACKS:
            while True:
                try:
                    s = int(input(f"如果選擇【{track}班群】，滿足程度是 (1-10): "))
                    if 1 <= s <= 10:
                        scores[category['id']][track] = s
                        break
                    else:
                        print("請輸入 1 到 10 之間的數字。")
                except ValueError:
                    print("請輸入有效的數字。")

    # Step 4: 結算
    print("\n" + "="*50)
    print("正在計算你的專屬生涯藍圖...")
    time.sleep(1)
    
    track_totals = {t: 0 for t in TRACKS}
    max_possible_total = sum(weights[c['id']] * 10 for c in CRITERIA)
    
    for category in CRITERIA:
        w = weights[category['id']]
        for track in TRACKS:
            track_totals[track] += w * scores[category['id']][track]
            
    results = []
    for track in TRACKS:
        percent = (track_totals[track] / max_possible_total) * 100 if max_possible_total > 0 else 0
        results.append({'track': track, 'score': track_totals[track], 'percent': percent})
        
    results.sort(key=lambda x: x['score'], reverse=True)
    top_track = results[0]['track']
    
    print("\n【分析結果】")
    print(f"🥇 最佳適配班群：{top_track}班群 ({results[0]['percent']:.1f}%)")
    print(f"描述：{TRACK_DETAILS[top_track]['desc']}\n")
    
    print("其他班群適配度：")
    for r in results[1:]:
        print(f" - {r['track']}班群: {r['percent']:.1f}%")

    # Step 5: AI 建議
    print("\n" + "="*50)
    print("【請求 AI 專業導航建議】")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        api_key = input("請輸入你的 GEMINI_API_KEY 以獲取 AI 建議\n(如果沒有，請直接按 Enter 跳過): ")
        
    if not api_key or not genai:
        print("\n未提供 API Key 或未安裝 google-genai，使用預設建議：")
        top_criteria = sorted(CRITERIA, key=lambda c: weights[c['id']], reverse=True)[0]
        print(f"既然你對於「{top_criteria['label']}」有著不可妥協的堅持，{top_track}班群絕對能為你提供最直接的資源與舞台！")
    else:
        try:
            client = genai.Client(api_key=api_key)
            from google.genai import types
            
            value_weights = "、".join([f"{c['label']} (權重 {weights[c['id']]}/10)" for c in CRITERIA])
            selected_labels = "、".join([i['label'] for i in selected_items]) if selected_items else "憑直覺綜合評分"
            
            prompt = f'''
使用者評測出來最適合的班群是：{top_track} 班群。
使用者評估的核心價值觀與權重為：{value_weights}。
使用者特別在意的細項包含：{selected_labels}。

請以繁體中文、融合「生涯建構理論」精神且貼近高中生的口吻，撰寫一段給高中生的選班群建議。生涯不是被決定好的，而是自己一步步建構出來的。必須包含以下要點，並使用列點符號表示：
1. 依據學生上述最看重的「核心價值觀」與關注的「細項」，為他量身打造，說明這個班群如何作為他們實踐這些價值與建構未來藍圖的絕佳起點。
2. 選擇此班群須考量的現實挑戰或適應問題（針對他們的價值觀，給點客製化的現實預防針）。
3. 與家長溝通此決定的技巧，展現自己對生涯已有思考與負責的態度。
語氣要像是一位親切、懂他們的學長姐，盡量客製化，不要說教！字數不要超過800字。
            '''
            
            print("AI 正在為你客製化分析，請稍候...\n")
            response = client.models.generate_content(
                model='gemini-3.1-pro-preview',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="你是一位洞悉高中生涯規劃的親切學長姐，專精於運用「生涯建構理論」。你擅長傾聽、不說教，總是能用溫暖、幽默的語氣，幫助學生從他們的興趣與價值觀中看見未來的潛力。請根據使用者提供的資訊，給予最深刻、具體的分析。",
                    temperature=0.7,
                    top_p=0.9,
                    top_k=40,
                    max_output_tokens=1024,
                )
            )
            print(response.text)
            
        except Exception as e:
            print(f"AI 生成失敗: {e}")

if __name__ == "__main__":
    main()
