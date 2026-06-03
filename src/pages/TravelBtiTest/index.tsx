import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  HelpCircle,
  MapPin,
  MessageSquare,
  MinusCircle,
  UsersRound,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { TravelBtiPageShell } from "../../components/TravelBtiPageShell";
import signpostIllustration from "../../../assets/travel-bti-test/travel-bti-test-side-signpost.png";
import "./index.less";

const choiceOptions = [
  { label: "强烈偏左", value: -2, icon: "double-left" },
  { label: "稍微偏左", value: -1, icon: "single-left" },
  { label: "中立 / 都可以", value: 0, icon: "neutral" },
  { label: "稍微偏右", value: 1, icon: "single-right" },
  { label: "强烈偏右", value: 2, icon: "double-right" },
];

const mockQuestions = [
  {
    id: "pace",
    dimension: "行程：紧凑 vs 松弛",
    left: "我喜欢把每天行程安排得充实紧凑",
    right: "我喜欢每天保留弹性和休息时间",
  },
  {
    id: "planning",
    dimension: "规划：提前安排 vs 随性探索",
    left: "我喜欢出发前把路线和餐厅都安排好",
    right: "我喜欢到当地后根据心情临时决定",
  },
  {
    id: "interest",
    dimension: "兴趣：人文城市 vs 自然风景",
    left: "我更想逛街巷、展馆和当地市集",
    right: "我更想看山海、湖泊和自然景观",
  },
  {
    id: "social",
    dimension: "互动：团队同行 vs 独处片刻",
    left: "旅行中我喜欢大部分时间和大家一起行动",
    right: "旅行中我希望留一点独处和自由活动时间",
  },
  {
    id: "budget",
    dimension: "花费：精打细算 vs 体验优先",
    left: "我会优先控制预算，选择性价比路线",
    right: "遇到值得的体验，我愿意多花一点预算",
  },
];

const featureItems = [
  { label: "了解你的旅行偏好", icon: UsersRound },
  { label: "促进团队更好协作", icon: UsersRound },
  { label: "生成团队旅行建议", icon: BarChart3 },
];

function ChoiceIcon({ type }: { type: string }) {
  if (type === "neutral") {
    return <MinusCircle size={34} strokeWidth={2.2} />;
  }

  const isLeft = type.includes("left");
  const isDouble = type.includes("double");
  const className = `choice-symbol ${isLeft ? "left" : "right"}`;

  return (
    <span className={className} aria-hidden="true">
      <ChevronRight size={34} strokeWidth={3.1} />
      {isDouble && <ChevronRight size={34} strokeWidth={3.1} />}
    </span>
  );
}

export function TravelBtiTestPage() {
  const navigate = useNavigate();
  const transitionTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isChoiceLocked, setIsChoiceLocked] = useState(false);

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === mockQuestions.length - 1;
  const progressPercent = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      if (finishTimerRef.current) {
        window.clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  const clearTransitionTimers = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
    }
  };

  const handleSelectAnswer = (value: number) => {
    if (isChoiceLocked) {
      return;
    }

    clearTransitionTimers();
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
    setIsChoiceLocked(true);

    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(true);

      finishTimerRef.current = window.setTimeout(() => {
        if (isLastQuestion) {
          window.localStorage.setItem(
            "teamtrip-travel-bti-answers",
            JSON.stringify({
              ...answers,
              [currentQuestion.id]: value,
            }),
          );
          navigate("/travel-bti/result");
          return;
        }

        setCurrentQuestionIndex((current) => current + 1);
        window.requestAnimationFrame(() => {
          setIsTransitioning(false);
          setIsChoiceLocked(false);
        });
      }, 220);
    }, 420);
  };

  const goPreviousQuestion = () => {
    if (!isFirstQuestion && !isChoiceLocked) {
      clearTransitionTimers();
      setIsChoiceLocked(true);
      setIsTransitioning(true);

      finishTimerRef.current = window.setTimeout(() => {
        setCurrentQuestionIndex((current) => current - 1);
        window.requestAnimationFrame(() => {
          setIsTransitioning(false);
          setIsChoiceLocked(false);
        });
      }, 220);
    }
  };

  return (
    <TravelBtiPageShell
      header={
        <AppHeader
          title="Travel-BTI 测试"
          actions={[
            {
              label: "退出测试",
              icon: DoorOpen,
              onClick: () => navigate("/teams"),
              variant: "ghost",
            },
          ]}
        />
      }
    >
      <section className="travel-bti-test-layout" aria-label="Travel-BTI 旅行偏好测试">
        <article className="travel-bti-quiz-card">
          <div className="quiz-title-row">
            <h1>Travel-BTI 旅行偏好测试</h1>
          </div>

          <div className="quiz-progress-meta">
            <p>
              第 <strong>{currentQuestionIndex + 1}</strong> / {mockQuestions.length} 题
            </p>
            <span>
              <Clock3 size={18} />
              预计 3 分钟完成
            </span>
          </div>

          <div className="quiz-progress-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>

          <div className={`quiz-content ${isTransitioning ? "is-switching" : ""}`}>
            <div className="quiz-question-block">
              <p className="quiz-question">
                你更倾向于
                <HelpCircle size={18} />
              </p>

              <div className="quiz-statement-row">
                <div className="quiz-statement left">
                  <MapPin size={52} fill="currentColor" strokeWidth={1.8} />
                  <strong>{currentQuestion.left}</strong>
                </div>

                <div className="quiz-versus" aria-hidden="true">
                  <span>VS</span>
                </div>

                <div className="quiz-statement right">
                  <strong>{currentQuestion.right}</strong>
                  <MapPin size={52} fill="currentColor" strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="quiz-choice-group" role="radiogroup" aria-label="旅行偏好选择">
              {choiceOptions.map((option) => (
                <button
                  className={`quiz-choice ${currentAnswer === option.value ? "selected" : ""}`}
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={currentAnswer === option.value}
                  disabled={isChoiceLocked}
                  onClick={() => handleSelectAnswer(option.value)}
                >
                  <ChoiceIcon type={option.icon} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="quiz-dimension-line">
              <MessageSquare size={18} />
              <span>当前维度：</span>
              <strong>{currentQuestion.dimension}</strong>
            </div>
          </div>

          <div className="quiz-card-divider" />

          <div className="quiz-actions">
            <button className="quiz-secondary-button" type="button" onClick={goPreviousQuestion} disabled={isFirstQuestion || isChoiceLocked}>
              <ChevronLeft size={20} />
              上一题
            </button>
            <button
              className="quiz-primary-button"
              type="button"
              disabled={isChoiceLocked}
              onClick={() => (currentAnswer === undefined ? handleSelectAnswer(0) : handleSelectAnswer(currentAnswer))}
            >
              {isLastQuestion ? "查看结果" : "跳过本题"}
              <ChevronRight size={20} />
            </button>
          </div>
        </article>

        <aside className="travel-bti-side-card" aria-label="Travel-BTI 测试说明">
          <img className="side-card-illustration" src={signpostIllustration} alt="" />
          <h2>发现更合拍的旅行方式</h2>
          <p>完成测试后，你将获得专属旅行画像，并用于团队画像聚合</p>
          <div className="side-card-divider" />

          <ul className="side-feature-list">
            {featureItems.map(({ label, icon: Icon }) => (
              <li key={label}>
                <span>
                  <Icon size={22} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </TravelBtiPageShell>
  );
}
