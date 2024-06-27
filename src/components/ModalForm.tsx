import React, { useCallback, useEffect, useMemo } from "react";
import { Form, Modal } from "antd";
import type { FormInstance, FormProps, ModalProps } from "antd";
import { useBindValue } from "../utils/use";
import classnames from "classnames";

export type ModalFormProps<T = Record<string, any>> = Omit<
  FormProps<T>,
  "onFinish" | "title"
> & {
  /**
   * 接收任意值，返回 真值 会关掉这个抽屉
   *
   * @name 表单结束后调用
   *
   * @example 结束后关闭抽屉
   * onFinish: async ()=> {await save(); return true}
   *
   * @example 结束后不关闭抽屉
   * onFinish: async ()=> {await save(); return false}
   */
  onFinish?: (formData: T) => Promise<any>;
  //   /** @name 提交数据时，禁用取消按钮的超时时间（毫秒）。 */
  //   submitTimeout?: number;
  /** @name 用于触发抽屉打开的 dom */
  trigger?: JSX.Element;
  /** @name 受控的打开关闭 */
  open?: ModalProps["open"];
  /** @name 打开关闭的事件 */
  onOpenChange?: (visible: boolean) => void;
  /**
   * 不支持 'visible'，请使用全局的 visible
   *
   * @name 弹框的属性
   */
  modalProps?: Omit<ModalProps, "visible">;
  /** @name 弹框的标题 */
  title?: ModalProps["title"];
  /** @name 弹框的宽度 */
  width?: ModalProps["width"];
  formRef?: any;
  children?: React.ReactNode;
  /** @name 是否全屏 */
  isFull?: boolean;
};

const ModalForm: React.FC<ModalFormProps> = (props) => {
  const {
    onFinish: propOnFinish,
    trigger,
    open: propOpen,
    onOpenChange: propOnOpenChange,
    modalProps,
    title,
    width,
    formRef,
    children,
    isFull,
    ...other
  } = props;
  const [open, setOpen] = useBindValue(propOpen, false);
  const [form] = Form.useForm();
  const onCancel = useCallback(
    () => {
      setOpen(false);
      propOnOpenChange?.(false);
      modalProps?.onCancel?.({} as any)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propOnOpenChange]
  );
  const afterClose = useCallback(() => {
    form.resetFields();
    modalProps?.afterClose?.()
  },[form, modalProps])
  const onFinish = useMemo(() => {
    return async function (value: any) {
      const v = await propOnFinish?.apply(null, [value]);
      if (v === true) {
        onCancel();
      }
    };
  }, [propOnFinish, onCancel]); // eslint-disable-line react-hooks/exhaustive-deps

  const _modalProps: ModalProps = useMemo(() => {
    const className = classnames(modalProps?.className, {
      'full-modal': isFull
    })
    return {
      ...modalProps,
      className,
      onCancel,
      onOk: () => {
        form.submit();
      },
      afterClose,
      open,
      title,
      width,
    };
  }, [afterClose, form, modalProps, onCancel, open, title, width, isFull]);

  useEffect(() => {
    if (!formRef) return;
    const type = typeof formRef;
    switch (type) {
      case "function":
        formRef(form);
        break;
      case "object":
        formRef.current = form;
        break;
      default:
        break;
    }
  }, [form, formRef]);

  return (
    <>
      <Modal {..._modalProps}>
        <Form form={form} onFinish={onFinish} {...other}>
          {children}
        </Form>
      </Modal>
      {trigger &&
        React.cloneElement(trigger, {
          onClick: () => {
            setOpen(true);
          },
        })}
    </>
  );
};

export default ModalForm;
