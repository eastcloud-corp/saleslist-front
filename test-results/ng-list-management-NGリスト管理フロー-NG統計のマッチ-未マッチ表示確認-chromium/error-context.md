# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: 開発環境
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: ソーシャルナビゲーター
        - generic [ref=e8]: アカウントにアクセスするには認証情報を入力してください
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]:
            - generic [ref=e12]: メールアドレス
            - textbox "メールアドレス" [active] [ref=e13]
          - generic [ref=e14]:
            - generic [ref=e15]: パスワード
            - textbox "パスワード" [ref=e16]
          - button "ログイン" [ref=e17]
        - alert [ref=e20]:
          - img [ref=e21]
          - generic [ref=e24]:
            - paragraph [ref=e25]: 開発環境用ログイン情報
            - generic [ref=e26]:
              - paragraph [ref=e27]:
                - generic [ref=e28]: "Email:"
                - text: test@dev.com
              - paragraph [ref=e29]:
                - generic [ref=e30]: "Password:"
                - text: dev123
            - button "デバッグ情報を自動入力" [ref=e31]
  - region "Notifications (F8)":
    - list
```