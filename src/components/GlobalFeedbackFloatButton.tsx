import React, { useMemo, useState } from "react";
import { FloatButton, Form, Input, message, Modal, Segmented } from "antd";
import { Headphones, MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { authTokenStorage, FeedbackType, feedbacksService } from "../services";
import "./GlobalFeedbackFloatButton.less";

type FeedbackFormValues = {
  feedbackType: FeedbackType;
  content?: string;
  contact?: string;
};

const HIDDEN_ROUTE_PREFIXES = ["/itinerary/", "/final-itinerary/"];

const shouldHideForPath = (pathname: string) =>
  pathname === "/login" || pathname === "/final-itinerary" || HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function GlobalFeedbackFloatButton() {
  const location = useLocation();
  const [form] = Form.useForm<FeedbackFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const feedbackType = Form.useWatch("feedbackType", form) ?? 0;
  const hasValidLogin = authTokenStorage.isAccessTokenValid() || Boolean(authTokenStorage.getRefresh());
  const hidden = !hasValidLogin || shouldHideForPath(location.pathname);
  const feedbackTypeOptions = useMemo(
    () => [
      { label: "好评", value: 0 },
      { label: "差评", value: 1 },
    ],
    [],
  );

  if (hidden) {
    return null;
  }

  const closeModal = () => {
    if (!isSubmitting) {
      setOpen(false);
    }
  };

  const submitFeedback = async (values: FeedbackFormValues) => {
    const content = values.content?.trim();
    const contact = values.contact?.trim();

    try {
      setIsSubmitting(true);
      await feedbacksService.submitFeedback({
        feedbackType: values.feedbackType,
        ...(content ? { content } : {}),
        ...(contact ? { contact } : {}),
        platform: "web",
      });
      messageApi.success("感谢反馈，我们会认真查看");
      setOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <FloatButton
        className="global-feedback-float-button"
        icon={<Headphones size={20} />}
        tooltip="反馈一下使用感受"
        type="primary"
        onClick={() => setOpen(true)}
      />
      <Modal
        centered
        className="global-feedback-modal"
        confirmLoading={isSubmitting}
        destroyOnHidden
        mask={{ enabled: true, blur: true, closable: !isSubmitting }}
        okText="提交反馈"
        open={open}
        title={
          <span className="global-feedback-modal__title">
            <MessageCircle size={20} />
            反馈一下使用感受
          </span>
        }
        width={480}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <p className="global-feedback-modal__intro">告诉我们哪里做得好，或哪里还可以更顺手。</p>
        <Form<FeedbackFormValues>
          form={form}
          initialValues={{ feedbackType: 0 }}
          layout="vertical"
          requiredMark={false}
          onFinish={submitFeedback}
        >
          <Form.Item name="feedbackType" label="反馈类型">
            <Segmented className="global-feedback-modal__type" options={feedbackTypeOptions} shape="round" />
          </Form.Item>
          <Form.Item
            name="content"
            label="反馈意见"
            rules={[
              { max: 1000, message: "反馈意见最多 1000 字" },
              {
                validator: (_, value?: string) => {
                  if (feedbackType === 1 && !value?.trim()) {
                    return Promise.reject(new Error("选择差评时请填写反馈意见"));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 7 }}
              maxLength={1000}
              placeholder={feedbackType === 1 ? "请告诉我们哪里体验不好，方便我们改进" : "喜欢哪里、希望保留什么，都可以告诉我们"}
              showCount
            />
          </Form.Item>
          <Form.Item name="contact" label="联系方式（可选）" rules={[{ max: 100, message: "联系方式最多 100 字" }]}>
            <Input placeholder="邮箱 / 手机号，便于我们回访" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
