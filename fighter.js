using System.Collections.Generic;
using UnityEngine; // Unity環境を想定

// ==========================================
// 1. 基盤となる列挙型（Enums）と構造体
// ==========================================

// パッシブスキルの種類
public enum PassiveSkillType {
    None,
    Vampire,       // 吸血鬼: 与ダメの20%回復
    Desperation,   // 背水の陣: HP30%以下で攻撃力1.5倍
    GiantBody,     // 巨人の体: 被ダメ20%カット
    Ninja          // 忍: 回避距離と速度UP
}

// 登場モーションの種類
public enum IntroMotionType {
    Drop,          // メテオドロップ
    Warp,          // 瞬間移動
    Taunt          // 余裕のシャドーボクシング
}

// 攻撃属性
public enum AttackAttribute {
    Neutral, Fire, Ice, Thunder
}

// 部位ごとのダメージ倍率設定用
public enum BodyPart {
    Head, Torso, Arms, Legs
}

// ==========================================
// 2. 体型＆カラーエディタ (BODY & COLOR)
// ==========================================
[System.Serializable]
public class BodyAndColorData {
    [Header("Body Proportions")]
    [Range(0.5f, 2.0f)] public float widthScale = 1.0f;  // 横幅（マッスル〜スレンダー）
    [Range(0.5f, 2.0f)] public float heightScale = 1.0f; // 縦幅（長身〜子供）
    [Range(0.5f, 2.0f)] public float headSize = 1.0f;    // 頭の大きさ（リアル〜等身大）

    [Header("Color Settings")]
    public Color bodyColor = Color.white;                // ボディの色（RGB1677万色）
    public Color auraColor = new Color(1f, 0.8f, 0f);    // オーラの色

    // 体型をモデルに適用するメソッドのイメージ
    public void ApplyBodyScale(Transform characterTransform) {
        characterTransform.localScale = new Vector3(widthScale, heightScale, widthScale);
        // ※頭のサイズはボーン（骨格）を直接操作する処理がここに入ります
    }
}

// ==========================================
// 3. 重量＆当たり判定エディタ (PHYSICS & COLLISION)
// ==========================================
[System.Serializable]
public class PhysicsAndCollisionData {
    [Header("Weight and Center of Mass")]
    [Range(50f, 200f)] public float internalWeight = 100f; // 内部的な体重
    [Range(-1f, 1f)] public float centerOfMassY = 0f;      // 重心の高さ（空中制御や吹き飛びに影響）

    [Header("Hitbox Multipliers")]
    // 部位ごとのダメージ倍率辞書
    public Dictionary<BodyPart, float> damageMultipliers = new Dictionary<BodyPart, float>() {
        { BodyPart.Head, 2.0f },   // デフォルト設定：頭は2倍
        { BodyPart.Torso, 1.0f },
        { BodyPart.Arms, 0.5f },   // 腕は0.5倍
        { BodyPart.Legs, 1.0f }
    };

    // 実際のダメージ計算に介入するメソッド
    public float CalculateTakenDamage(float baseDamage, BodyPart hitPart) {
        float multiplier = damageMultipliers.ContainsKey(hitPart) ? damageMultipliers[hitPart] : 1.0f;
        float weightDefenseBonus = (internalWeight - 100f) * 0.1f; // 体重が重いほど少し硬くなる例
        
        float finalDamage = (baseDamage * multiplier) - weightDefenseBonus;
        return Mathf.Max(1f, finalDamage); // 最低1ダメージは保証
    }
}

// ==========================================
// 4. キャラクターベースクラス（一部）
// ==========================================
public class UltimateCharacter : MonoBehaviour {
    public BodyAndColorData bodyData;
    public PhysicsAndCollisionData physicsData;

    void Start() {
        // 初期化時に体型を適用
        bodyData.ApplyBodyScale(this.transform);
    }
}
using System.Collections.Generic;
using UnityEngine;

// ==========================================
// 【Part 2】アクション＆コンボ、VFX＆サウンド
// ==========================================

// 1. カスタムアクション（フレームと属性の定義）
[System.Serializable]
public class CustomAction {
    public string actionName;
    [Header("Frame Data")]
    public int startupFrames = 10;   // 発生にかかるフレーム
    public int activeFrames = 5;     // 攻撃判定の持続フレーム
    public int recoveryFrames = 15;  // 攻撃後の硬直フレーム

    [Header("Properties")]
    public float baseDamage = 10f;
    public AttackAttribute attribute = AttackAttribute.Neutral; // 炎、氷など
    public bool causesGuardBreak = false; // ガードブレイク判定
}

// 2. コンボツリー（自由連結システム）
[System.Serializable]
public class ComboNode {
    public CustomAction action;
    public List<ComboNode> nextActions = new List<ComboNode>(); // 派生ルート
}

// 3. VFX＆サウンドクリエイター
[System.Serializable]
public class VfxAndSoundData {
    public AudioClip customBgm;           // BGMハイジャック用
    public GameObject customHitEffect;    // ヒットエフェクト（血、アメコミ文字など）
    [Range(0.5f, 2.0f)] public float voicePitch = 1.0f; // ボイスの高さ
}

// 4. パッシブスキルマネージャー
[System.Serializable]
public class PassiveSkillManager {
    public PassiveSkillType currentPassive = PassiveSkillType.None;

    // ダメージ計算時にパッシブ効果を適用するメソッド
    public float ApplyDefensivePassive(float incomingDamage) {
        if (currentPassive == PassiveSkillType.GiantBody) {
            return incomingDamage * 0.8f; // 巨人の体：ダメージ20%カット
        }
        return incomingDamage;
    }

    public float ApplyOffensivePassive(float outgoingDamage, float currentHpRatio) {
        if (currentPassive == PassiveSkillType.Desperation && currentHpRatio <= 0.3f) {
            return outgoingDamage * 1.5f; // 背水の陣：HP30%以下で火力1.5倍
        }
        return outgoingDamage;
    }
}

// ==========================================
// 【Part 3】覚醒、AIロジック、全体統合
// ==========================================

// 5. 覚醒・変身システム
[System.Serializable]
public class AwakeningSystem {
    public enum TriggerCondition { HPUnder20, TimeElapsed60s, Combo50Hits }
    
    public TriggerCondition triggerCondition;
    public BodyAndColorData awakenedForm;         // 覚醒後の姿
    public PassiveSkillType awakenedPassive;      // 覚醒後のスキル
    public AudioClip awakeningBgm;                // 覚醒時専用BGM
    
    public bool isAwakened = false;

    // 覚醒処理の実行
    public void ActivateAwakening(UltimateCharacter character) {
        isAwakened = true;
        Debug.Log("【覚醒発動】姿とスキルが変化し、BGMがハイジャックされました！");
        // ここで姿の変更やBGMの再生処理を呼び出す
    }
}

// 6. AIロジック＆性格マトリクス（ガンビットシステム）
[System.Serializable]
public class AILogicMatrix {
    public enum Condition { EnemyFar, EnemyDown, SelfHPLow, Default }
    public enum ActionCommand { ShootProjectile, Taunt, RetreatAndHeal, Attack }

    // 条件と行動の紐付け（ガンビット）
    public Dictionary<Condition, ActionCommand> gambits = new Dictionary<Condition, ActionCommand>() {
        { Condition.EnemyFar, ActionCommand.ShootProjectile },
        { Condition.SelfHPLow, ActionCommand.RetreatAndHeal }
    };

    [Range(0f, 1f)] public float aggressiveness = 0.5f; // 好戦性（0=慎重、1=特攻）

    public ActionCommand DecideNextAction(Condition currentState) {
        if (gambits.ContainsKey(currentState)) {
            return gambits[currentState];
        }
        return ActionCommand.Attack; // デフォルト行動
    }
}

// ==========================================
// 🌟 全体統合クラス（UltimateCharacter 完成版）
// ==========================================
public class UltimateCharacter : MonoBehaviour {
    [Header("Part 1: Body & Physics")]
    public BodyAndColorData bodyData;
    public PhysicsAndCollisionData physicsData;

    [Header("Part 2: Action, Vfx & Passives")]
    public ComboNode baseComboTree;
    public VfxAndSoundData vfxSoundData;
    public PassiveSkillManager passiveManager;

    [Header("Part 3: Awakening, AI & Intro")]
    public AwakeningSystem awakening;
    public AILogicMatrix aiLogic;
    public IntroMotionType introMotion;

    // ステータス
    private float maxHp = 1000f;
    private float currentHp = 1000f;

    void Start() {
        // 1. 体型の初期化
        bodyData.ApplyBodyScale(this.transform);
        
        // 2. 登場モーションの再生
        PlayIntroMotion();
    }

    void Update() {
        // 覚醒条件の監視（例：HP20%以下）
        if (!awakening.isAwakened && awakening.triggerCondition == AwakeningSystem.TriggerCondition.HPUnder20) {
            if ((currentHp / maxHp) <= 0.2f) {
                awakening.ActivateAwakening(this);
            }
        }
    }

    // ダメージを受ける処理の統合
    public void TakeDamage(float baseDamage, BodyPart hitPart) {
        // 物理データからの部位ダメージ計算
        float partDamage = physicsData.CalculateTakenDamage(baseDamage, hitPart);
        
        // パッシブスキル（防御系）の適用
        float finalDamage = passiveManager.ApplyDefensivePassive(partDamage);
        
        currentHp -= finalDamage;
        Debug.Log($"ダメージを受けた！ 残りHP: {currentHp}");
    }

    // 登場モーション処理
    private void PlayIntroMotion() {
        switch(introMotion) {
            case IntroMotionType.Drop:
                Debug.Log("【INTRO】上空から隕石のように激突して登場！"); break;
            case IntroMotionType.Warp:
                Debug.Log("【INTRO】閃光と共に瞬間移動で出現！"); break;
            case IntroMotionType.Taunt:
                Debug.Log("【INTRO】余裕のシャドーボクシングで挑発！"); break;
        }
    }
}
